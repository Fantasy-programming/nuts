import { UserInfo } from "@/features/preferences/services/user";
import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])[A-Za-z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{8,}$/,
      "Password must contain at least one lowercase letter, one uppercase letter, one number and one special character"
    ),
  confirmPassword: z.string(),
})
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(4, "this password is too short"),
  two_fa_code: z.string().optional(),
});

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  created_at: z.date(),
  updated_at: z.date(),
});


export const userSessionSchema = z.object({
  id: z.string().uuid(),
  browser_name: z.string().email(),
  device_name: z.string().optional(),
  ip_address: z.string().optional(),
  last_used_at: z.string(),
  location: z.string(),
  os_name: z.string(),

});

export type User = z.infer<typeof userSchema>;
export type SignupFormValues = z.infer<typeof signupSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type SessionSchema = z.infer<typeof userSessionSchema>

export interface LoginResponse {
  two_fa_required?: boolean;
  access_token?: string;
  refresh_token?: string;
}

export interface ErrorResponse {
  error: string;
  success: boolean;
}

export interface InitMFASchema { qr_code_url: string; secret: string }


export type AuthNullable = UserInfo | null;


export interface RefreshAuthRes {
  access_token: string;
  refresh_token: string;
}

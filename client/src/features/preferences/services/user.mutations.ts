import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "./user";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { AuthNullable } from "@/features/auth/services/auth.types";


export const useUpdateAvatar = (user: AuthNullable) => {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser)

  return useMutation({
    mutationFn: userService.updateAvatar,
    onError: (error) => {
      console.error("Failed to upload avatar:", error);
    },
    onSuccess: (data) => {
      // Update the user in auth store with the new avatar URL
      if (user) {
        setUser({
          ...user,
          avatar_url: data.avatar_url
        });
      }
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
}

export const useUpdateUserInfo = () => {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser)

  return useMutation({
    mutationFn: userService.updateMe,
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      setUser(updatedUser); // Update user in auth store
    },
  });

}

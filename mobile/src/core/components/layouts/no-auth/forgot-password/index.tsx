import { type AuthError } from "@supabase/supabase-js";
import { useRouter } from "expo-router";
import React from "react";
import { Controller, type SubmitHandler, useForm } from "react-hook-form";

import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Input, InputField } from "@/components/ui/input";
import { SafeAreaView } from "@/components/ui/safe-area-view";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAuth } from "@/provider/SupabaseProvider";

interface ForgotPasswordFormInputs {
  email: string;
}

const ForgotPassword = () => {
  const router = useRouter();
  const { sendNewPasswordLink, handleError, isLoading } = useAuth();
  const { control, handleSubmit, reset } = useForm<ForgotPasswordFormInputs>({
    defaultValues: {
      email: "",
    },
  });

  const onSubmit: SubmitHandler<ForgotPasswordFormInputs> = async (data) => {
    try {
      await sendNewPasswordLink(data.email);
      reset();
      router.back();
    } catch (error) {
      handleError(error as AuthError);
    }
  };

  return (
    <SafeAreaView className="bg-background flex-1">
      <VStack className="mx-auto w-full flex-1 p-4 lg:w-[400px]" space="xl">
        {/* Logo and Title */}
        <VStack space="sm" className="mt-4 items-start">
          <Text className="text-4xl font-bold text-typography-900">
            Forgot Password
          </Text>
          <Text className="text-lg text-typography-900/60">
            Enter your email address and we'll send you a link to reset your
            password.
          </Text>
        </VStack>

        {/* Form */}
        <VStack space="md" className="w-full">
          <Controller
            control={control}
            name="email"
            rules={{
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address",
              },
            }}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <FormControl isInvalid={!!error} className="relative">
                <FormControlLabel>
                  <FormControlLabelText>Email</FormControlLabelText>
                </FormControlLabel>
                <Input className="android:h-12">
                  <InputField
                    value={value}
                    onChangeText={onChange}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="text-typography-900"
                  />
                </Input>
                {error && (
                  <Text size="sm" className="mt-1 text-red-500">
                    {error.message}
                  </Text>
                )}
              </FormControl>
            )}
          />

          <Button
            size="lg"
            variant="solid"
            action="primary"
            onPress={handleSubmit(onSubmit)}
          >
            {isLoading ? (
              <ButtonSpinner />
            ) : (
              <ButtonText>Send Reset Link</ButtonText>
            )}
          </Button>

          <Button
            size="lg"
            variant="outline"
            action="primary"
            onPress={() => router.back()}
          >
            <ButtonText>Back to Sign In</ButtonText>
          </Button>
        </VStack>
      </VStack>
    </SafeAreaView>
  );
};

export default ForgotPassword;

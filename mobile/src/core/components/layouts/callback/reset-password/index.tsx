import React from "react";
import { useRouter } from "expo-router";
import { Text } from "@/components/ui/text";
import { SafeAreaView } from "@/components/ui/safe-area-view";
import { VStack } from "@/components/ui/vstack";
import { Button, ButtonText } from "@/components/ui/button";
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
} from "@/components/ui/form-control";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react-native";
import { KeyboardAvoidingView, Platform } from "react-native";
import { AuthError } from "@supabase/supabase-js";
import { useAuth } from "@/provider/SupabaseProvider";
import { Box } from "@/components/ui/box";
import { ScrollView } from "@/components/ui/scroll-view";
import { Spinner } from "@/components/ui/spinner";

interface ResetPasswordForm {
  password: string;
  confirmPassword: string;
}

const LoadingScreen = () => (
  <Box className="flex-1 bg-background dark:bg-background-dark justify-center items-center">
    <VStack space="md" className="items-center">
      <Spinner size={"small"} />
      <Text className="text-base">Loading...</Text>
    </VStack>
  </Box>
);

const NotFoundScreen = () => {
  const router = useRouter();

  return (
    <Box className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView contentContainerClassName="flex-grow justify-center items-center p-6">
        <VStack space="xl" className="items-center">
          <Text className="text-2xl font-bold text-center">
            Session Not Found
          </Text>
          <Text className="text-base text-center text-gray-500">
            Please try resetting your password again
          </Text>
          <Button variant="solid" onPress={() => router.back()}>
            <ButtonText>Go Back</ButtonText>
          </Button>
        </VStack>
      </ScrollView>
    </Box>
  );
};

export default function ResetPasswordScreen() {
  const router = useRouter();
  const {
    handleError,
    showPassword,
    handleShowPassword,
    session,
    isLoading,
    setNewPassword,
  } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ResetPasswordForm>({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit: SubmitHandler<ResetPasswordForm> = async (data) => {
    if (data.password !== data.confirmPassword) {
      return;
    }
    try {
      await setNewPassword(data.password);
      reset();
      router.back();
    } catch (error) {
      handleError(error as AuthError);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <NotFoundScreen />;
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center p-6"
          keyboardShouldPersistTaps="handled"
        >
          <VStack space="2xl">
            <VStack space="xs">
              <Text className="text-2xl font-bold">Reset Password</Text>
              <Text className="text-base text-gray-500">
                Please enter your new password
              </Text>
            </VStack>

            <VStack space="md">
              <FormControl isInvalid={!!errors.password}>
                <Controller
                  control={control}
                  name="password"
                  rules={{
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  }}
                  render={({ field: { onChange, value } }) => (
                    <Input className="android:h-12">
                      <InputField
                        value={value}
                        onChangeText={onChange}
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your new password"
                        className="text-black dark:text-white"
                      />
                      <InputSlot onPress={handleShowPassword} className="mr-2">
                        <InputIcon as={showPassword ? Eye : EyeOff} />
                      </InputSlot>
                    </Input>
                  )}
                />
                <FormControlError>
                  <FormControlErrorText>
                    {errors.password?.message}
                  </FormControlErrorText>
                </FormControlError>
              </FormControl>

              <FormControl isInvalid={!!errors.confirmPassword}>
                <Controller
                  control={control}
                  name="confirmPassword"
                  rules={{
                    required: "Please confirm your password",
                    validate: (value, formValues) =>
                      value === formValues.password || "Passwords do not match",
                  }}
                  render={({ field: { onChange, value } }) => (
                    <Input className="android:h-12">
                      <InputField
                        value={value}
                        onChangeText={onChange}
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm your new password"
                        className="text-black dark:text-white"
                      />
                      <InputSlot onPress={handleShowPassword} className="mr-2">
                        <InputIcon as={showPassword ? Eye : EyeOff} />
                      </InputSlot>
                    </Input>
                  )}
                />
                <FormControlError>
                  <FormControlErrorText>
                    {errors.confirmPassword?.message}
                  </FormControlErrorText>
                </FormControlError>
              </FormControl>
            </VStack>

            <Button variant="solid" size="lg" onPress={handleSubmit(onSubmit)}>
              <ButtonText>Reset Password</ButtonText>
            </Button>
          </VStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

import React from "react";
import { Platform, View } from "react-native";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from "@/core/components/ui/form-control";
import { VStack } from "@/core/components/ui/vstack";
import { Text } from "@/core/components/ui/text";
import { Input, InputField, InputIcon, InputSlot } from "@/core/components/ui/input";
import {
  Button,
  ButtonIcon,
  ButtonSpinner,
  ButtonText,
} from "@/core/components/ui/button";
import {
  Checkbox,
  CheckboxIndicator,
  CheckboxLabel,
  CheckboxIcon,
} from "@/core/components/ui/checkbox";
import { Box } from "@/core/components/ui/box";
import { CheckIcon, Eye, EyeOff } from "lucide-react-native";
import { SafeAreaView } from "@/core/components/ui/safe-area-view";
import { Link } from "expo-router";
import { Image } from "@/core/components/ui/image";
import { GoogleIcon } from "@/core/components/icons/google";
import { AppleIcon } from "@/core/components/icons/apple";
import { HStack } from "@/core/components/ui/hstack";
import { useAuth } from "@/provider/SupabaseProvider";
import {
  FieldValues,
  SubmitHandler,
  useForm,
  Controller,
} from "react-hook-form";

interface SignInFormInputs {
  email: string;
  password: string;
  rememberMe: boolean;
}

const SignIn = () => {
  const {
    signIn,
    isLoading,
    signInWithGoogle,
    signInWithApple,
    showPassword,
    handleShowPassword,
  } = useAuth();

  const { control, handleSubmit, reset } = useForm<SignInFormInputs>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit: SubmitHandler<FieldValues> = async (data) => {
    await signIn(data.email, data.password);
    reset();
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <VStack
        className="flex-1 px-4 lg:w-[400px] mx-auto w-full pt-8"
        space="xl"
      >
        <VStack space="sm" className="items-center mt-4">
          <Box className="w-16 h-16 ">
            <Image
              source={require("@/assets/images/icon.png")}
              alt="Logo"
              className="w-full h-full"
            />
          </Box>
          <Text className="text-4xl font-bold text-typography-900">
            Sign In
          </Text>
        </VStack>

        {/* Form */}
        <VStack space="lg" className="w-full">
          {/* Email Input */}
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
                  <Text size="sm" className="text-red-500 mt-1">
                    {error.message}
                  </Text>
                )}
              </FormControl>
            )}
          />

          <Controller
            control={control}
            name="password"
            rules={{
              required: "Password is required",
              minLength: {
                value: 6,
                message: "Password must be at least 6 characters long",
              },
            }}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <FormControl isInvalid={!!error} className="relative">
                <FormControlLabel>
                  <FormControlLabelText>Password</FormControlLabelText>
                </FormControlLabel>
                <Input className="android:h-12">
                  <InputField
                    value={value}
                    onChangeText={onChange}
                    placeholder="Enter your password"
                    secureTextEntry={!showPassword}
                    className="text-typography-900"
                  />
                  <InputSlot onPress={handleShowPassword} className="mr-2">
                    <InputIcon as={showPassword ? Eye : EyeOff} />
                  </InputSlot>
                </Input>
                {error && (
                  <Text size="sm" className="text-red-500 mt-1">
                    {error.message}
                  </Text>
                )}
              </FormControl>
            )}
          />

          <HStack className="justify-between items-center">
            <Controller
              control={control}
              name="rememberMe"
              render={({ field: { onChange, value } }) => (
                <Checkbox
                  value={value ? "true" : "false"}
                  isChecked={value}
                  onChange={onChange}
                >
                  <CheckboxIndicator>
                    <CheckboxIcon as={CheckIcon} />
                  </CheckboxIndicator>
                  <CheckboxLabel>Remember me</CheckboxLabel>
                </Checkbox>
              )}
            />
            <Link href="/forgot-password" asChild>
              <Text className="underline">Forgot Password?</Text>
            </Link>
          </HStack>

          <Button size="lg" className="" onPress={handleSubmit(onSubmit)}>
            {isLoading ? <ButtonSpinner /> : <ButtonText>Sign In</ButtonText>}
          </Button>

          {/* Divider */}
          <HStack className="items-center my-4">
            <Box className="flex-1 h-[1px] bg-typography-900/10" />
            <Text className="mx-4 text-typography-900/40">or</Text>
            <Box className="flex-1 h-[1px] bg-typography-900/10" />
          </HStack>

          {/* Social Buttons */}
          <VStack space="md">
            <Button
              size="xl"
              variant="outline"
              action="primary"
              onPress={signInWithGoogle}
            >
              {isLoading ? (
                <ButtonSpinner />
              ) : (
                <>
                  <ButtonIcon as={GoogleIcon} className="w-5 h-5" />
                  <ButtonText>Continue with Google</ButtonText>
                </>
              )}
            </Button>

            {Platform.OS === "ios" && (
              <Button
                size="xl"
                variant="outline"
                action="primary"
                onPress={signInWithApple}
                className="bg-white data-[active=true]:bg-white/90 data-[hover=true]:bg-white/90"
              >
                {isLoading ? (
                  <ButtonSpinner />
                ) : (
                  <>
                    <ButtonIcon as={AppleIcon} className="w-5 h-5" />
                    <ButtonText className="text-black">
                      Continue with Apple
                    </ButtonText>
                  </>
                )}
              </Button>
            )}
          </VStack>

          <View className="flex-row justify-center mt-4">
            <Text size="md">Don't have an account? </Text>
            <Link href="/sign-up" asChild>
              <Text size="md" className="font-bold">
                Sign Up
              </Text>
            </Link>
          </View>
        </VStack>
      </VStack>
    </SafeAreaView>
  );
};

export default SignIn;

import React from "react";
import { VStack } from "@/core/components/ui/vstack";
import { HStack } from "@/core/components/ui/hstack";
import { Text } from "@/core/components/ui/text";
import { Image } from "@/core/components/ui/image";
import { Input, InputField, InputIcon, InputSlot } from "@/core/components/ui/input";
import { Button, ButtonSpinner, ButtonText } from "@/core/components/ui/button";
import { Box } from "@/core/components/ui/box";
import { SafeAreaView } from "@/core/components/ui/safe-area-view";
import { CheckIcon, Eye, EyeOff } from "lucide-react-native";
import { GoogleIcon } from "@/core/components/icons/google";
import { AppleIcon } from "@/core/components/icons/apple";
import { Pressable } from "@/core/components/ui/pressable";
import { Link } from "expo-router";
import { Icon } from "@/core/components/ui/icon";
import { Platform } from "react-native";
import { FormControlLabelText } from "@/core/components/ui/form-control";
import { FormControlLabel } from "@/core/components/ui/form-control";
import { FormControl } from "@/core/components/ui/form-control";
import {
  Controller,
  FieldValues,
  SubmitHandler,
  useForm,
} from "react-hook-form";
import {
  Checkbox,
  CheckboxIcon,
  CheckboxIndicator,
  CheckboxLabel,
} from "@/core/components/ui/checkbox";
import * as WebBrowser from "expo-web-browser";
import { useAuth } from "@/provider/SupabaseProvider";

interface SignUpFormInputs {
  email: string;
  password: string;
  privacyPolicy: boolean;
}

export default function SignUp() {
  const { control, handleSubmit, reset, watch } = useForm<SignUpFormInputs>({
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const privacyPolicy = watch("privacyPolicy");
  const {
    signUp,
    isLoading,
    signInWithGoogle,
    signInWithApple,
    showPassword,
    handleShowPassword,
  } = useAuth();

  const onSubmit: SubmitHandler<FieldValues> = async (data) => {
    await signUp(data.email, data.password);
    reset();
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <VStack
        className="flex-1 px-4 lg:w-[400px] mx-auto w-full py-8"
        space="xl"
      >
        {/* Logo and Title */}
        <VStack space="sm" className="items-center mt-4">
          <Box className="w-16 h-16">
            <Image
              source={require("@/assets/images/icon.png")}
              alt="Logo"
              className="w-full h-full"
            />
          </Box>
          <Text className="text-4xl font-bold text-typography-900">
            Sign Up
          </Text>
        </VStack>

        {/* Form */}
        <VStack space="md" className="w-full">
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

          {/* Password Input */}
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
                    className="text-typography-900"
                    type={showPassword ? "text" : "password"}
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

          <VStack className="w-full py-1">
            <Controller
              control={control}
              name="privacyPolicy"
              render={({ field: { onChange, value } }) => (
                <Checkbox
                  value={value ? "true" : "false"}
                  isChecked={value}
                  onChange={onChange}
                >
                  <CheckboxIndicator>
                    <CheckboxIcon as={CheckIcon} />
                  </CheckboxIndicator>
                  <Pressable
                    onPress={() =>
                      WebBrowser.openBrowserAsync(
                        "https://shipmobilefast.com/privacy-policy"
                      )
                    }
                  >
                    <CheckboxLabel className="flex-row items-center underline">
                      I agree to the Terms of Service and Privacy Policy
                    </CheckboxLabel>
                  </Pressable>
                </Checkbox>
              )}
            />
          </VStack>

          <Button
            size="lg"
            variant="solid"
            action="primary"
            onPress={handleSubmit(onSubmit)}
            disabled={!privacyPolicy}
          >
            {isLoading ? <ButtonSpinner /> : <ButtonText>Sign Up</ButtonText>}
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
              disabled={!privacyPolicy}
              onPress={signInWithGoogle}
            >
              {isLoading ? (
                <ButtonSpinner />
              ) : (
                <>
                  <Icon as={GoogleIcon} className="w-5 h-5" />
                  <ButtonText>Continue with Google</ButtonText>
                </>
              )}
            </Button>

            {Platform.OS === "ios" && (
              <Button
                size="xl"
                variant="outline"
                disabled={!privacyPolicy}
                onPress={signInWithApple}
                className="bg-white data-[active=true]:bg-white/80 data-[hover=true]:bg-white/80"
              >
                {isLoading ? (
                  <ButtonSpinner />
                ) : (
                  <>
                    <Icon as={AppleIcon} />
                    <ButtonText className="text-typography">
                      Continue with Apple
                    </ButtonText>
                  </>
                )}
              </Button>
            )}
          </VStack>

          {/* Sign In Link */}
          <HStack className="justify-center items-center mt-4" space="sm">
            <Text className="text-primary-900">Already have an account?</Text>
            <Link href="/sign-in" asChild>
              <Text size="md" className="font-bold">
                Sign In
              </Text>
            </Link>
          </HStack>
        </VStack>
      </VStack>
    </SafeAreaView>
  );
}

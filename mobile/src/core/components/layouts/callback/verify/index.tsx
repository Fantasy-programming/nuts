import React, { useEffect } from "react";
import { useAuth } from "@/provider/SupabaseProvider";
import { useRouter } from "expo-router";
import { Center } from "@/components/ui/center";
import { Text } from "@/components/ui/text";
import { Spinner } from "@/components/ui/spinner";
import { VStack } from "@/components/ui/vstack";

export default function Verify() {
  const { isLoading, session } = useAuth();

  const router = useRouter();

  useEffect(() => {
    if (session) {
      setTimeout(() => {
        router.back();
      }, 2000);
    }
  }, [session]);

  if (!session && !isLoading) {
    return (
      <Center className="flex-1">
        <VStack space="lg" className="items-center">
          <Spinner size="large" />
          <Text className="text-center font-bold px-4 text-lg">
            Please check your email
          </Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Center className="flex-1">
      <VStack space="lg" className="items-center">
        <Spinner size="large" />
        <Text className="text-center font-bold px-4 text-lg">Verifying...</Text>
      </VStack>
    </Center>
  );
}

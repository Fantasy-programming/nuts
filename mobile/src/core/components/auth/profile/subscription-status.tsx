import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { Icon } from "@/components/ui/icon";
import { Crown, ChevronRight } from "lucide-react-native";
import { useRouter } from "expo-router";

export function SubscriptionStatus() {
  const router = useRouter();

  return (
    <VStack className="mb-5 mx-4">
      <Box className="bg-background p-5 rounded-2xl border border-outline-100">
        <HStack className="justify-between items-center">
          <HStack space="md" className="items-center">
            <Box className="bg-[#ffce08] p-2 rounded-lg">
              <Icon as={Crown} size="lg" className="text-black" />
            </Box>
            <VStack>
              <Text className="text-base font-bold text-primary-900">
                Free Trial
              </Text>
              <Text className="text-sm text-typography-500">
                Valid until Dec 2024
              </Text>
            </VStack>
          </HStack>
          <Button
            size="sm"
            className="rounded-xl bg-[#ffce08] data-[active=true]:bg-[#ffce08]/80"
            onPress={() => router.push("/paywall-double")}
          >
            <ButtonText className="font-bold text-black data-[active=true]:text-black/80">
              Upgrade
            </ButtonText>
            <ButtonIcon as={ChevronRight} size="sm" className="text-black" />
          </Button>
        </HStack>
      </Box>
    </VStack>
  );
}

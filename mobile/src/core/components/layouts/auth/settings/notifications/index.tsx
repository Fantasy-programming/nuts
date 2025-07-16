import React, { useState, useEffect, useCallback } from "react";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { usePushNotification } from "@/hooks/usePushNotification";
import { SafeAreaView } from "@/components/ui/safe-area-view";
import { FlatList } from "@/components/ui/flat-list";
import { Center } from "@/components/ui/center";

interface NotificationData {
  id: string;
  title: string;
  message: string;
  receivedAt: Date;
}

const NotificationsScreen = () => {
  const { expoPushToken, sendPushNotification, notification } =
    usePushNotification();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const onPress = useCallback(() => {
    if (expoPushToken) {
      sendPushNotification(expoPushToken);
    }
  }, [expoPushToken, sendPushNotification]);

  useEffect(() => {
    if (notification) {
      const newNotification: NotificationData = {
        id: notification.request.identifier,
        title: notification.request.content.title ?? "No Title",
        message: notification.request.content.body ?? "No Message",
        receivedAt: new Date(),
      };
      setNotifications((prevNotifications) => [
        ...prevNotifications,
        newNotification,
      ]);
    }
  }, [notification]);

  const renderItem = useCallback(
    ({ item }: { item: NotificationData }) => (
      <Box className="p-4 mb-4 border border-outline dark:border-outline-dark rounded-lg">
        <VStack space="sm">
          <Text className="text-lg font-bold">{item.title}</Text>
          <Text className="text-base">{item.message}</Text>
          <Text className="text-sm text-gray-500">
            {item.receivedAt.toLocaleString()}
          </Text>
        </VStack>
      </Box>
    ),
    []
  );

  const keyExtractor = useCallback(
    (item: NotificationData) => `${item.id}-${item.receivedAt.getTime()}`,
    []
  );

  const ListEmptyComponent = useCallback(
    () => <Text className="text-center mt-4">No notifications yet</Text>,
    []
  );

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <Box className="flex-1 p-4 relative">
        <VStack space="lg">
          <Box>
            <Text className="text-lg font-bold mb-2">Push Token:</Text>
            <Text className="text-base mb-6">{expoPushToken}</Text>
          </Box>

          <Text className="text-lg font-bold mb-4">Received Notifications</Text>

          <FlatList
            data={notifications}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            ListEmptyComponent={ListEmptyComponent}
            removeClippedSubviews
            maxToRenderPerBatch={5}
            windowSize={5}
          />
        </VStack>

        <Center className="absolute bottom-10 left-0 right-0 px-4">
          <Button action="primary" onPress={onPress} className="w-full">
            <ButtonText className="font-bold">Send Notification</ButtonText>
          </Button>
        </Center>
      </Box>
    </SafeAreaView>
  );
};

export default NotificationsScreen;

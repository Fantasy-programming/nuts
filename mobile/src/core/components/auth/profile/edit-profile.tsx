import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalBody,
  ModalHeader,
} from "@/components/ui/modal";
import { VStack } from "@/components/ui/vstack";
import { Input, InputField } from "@/components/ui/input";
import { Button, ButtonText } from "@/components/ui/button";
import { KeyboardAvoidingView, Platform } from "react-native";
import { Box } from "@/components/ui/box";
import { Pressable } from "@/components/ui/pressable";
import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from "@/components/ui/avatar";
import { Camera } from "lucide-react-native";
import { HStack } from "@/components/ui/hstack";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Text } from "@/components/ui/text";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { Center } from "@/components/ui/center";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalBackdrop />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="w-full px-4"
      >
        <ModalContent className="w-full">
          <ModalHeader className="items-center justify-center">
            <Text className="text-xl font-semibold text-typography-900">
              Edit Profile
            </Text>
          </ModalHeader>
          <ModalBody showsVerticalScrollIndicator={false}>
            <VStack space="xl">
              <Center>
                <Pressable>
                  <Avatar size="2xl">
                    <AvatarFallbackText>SF</AvatarFallbackText>
                    <AvatarImage
                      source={{
                        uri: "https://via.placeholder.com/100",
                      }}
                    />
                  </Avatar>
                  <Box className="absolute bottom-0 right-0 p-2 rounded-full bg-black">
                    <Camera size={16} color="white" />
                  </Box>
                </Pressable>
              </Center>

              <VStack space="lg" className="w-full">
                <FormControl>
                  <FormControlLabel>
                    <FormControlLabelText className="text-sm font-medium">
                      Full Name
                    </FormControlLabelText>
                  </FormControlLabel>
                  <Input className="android:h-12 w-full">
                    <InputField
                      placeholder="Enter your full name"
                      defaultValue=""
                    />
                  </Input>
                </FormControl>

                <FormControl>
                  <FormControlLabel>
                    <FormControlLabelText className="text-sm font-medium">
                      Email
                    </FormControlLabelText>
                  </FormControlLabel>
                  <Input className="android:h-12 w-full">
                    <InputField
                      placeholder="Enter your email"
                      defaultValue=""
                    />
                  </Input>
                </FormControl>

                <FormControl>
                  <FormControlLabel>
                    <FormControlLabelText className="text-sm font-medium">
                      Job Title
                    </FormControlLabelText>
                  </FormControlLabel>
                  <Input className="android:h-12 w-full">
                    <InputField
                      placeholder="Enter your job title"
                      defaultValue=""
                    />
                  </Input>
                </FormControl>

                <FormControl>
                  <FormControlLabel>
                    <FormControlLabelText className="text-sm font-medium">
                      Bio
                    </FormControlLabelText>
                  </FormControlLabel>
                  <Textarea>
                    <TextareaInput
                      placeholder="Once upon a time..."
                      defaultValue=""
                    />
                  </Textarea>
                </FormControl>

                <FormControl>
                  <FormControlLabel>
                    <FormControlLabelText className="text-sm font-medium">
                      Location
                    </FormControlLabelText>
                  </FormControlLabel>
                  <Input className="android:h-12 w-full ">
                    <InputField
                      placeholder="Enter your location"
                      defaultValue=""
                    />
                  </Input>
                </FormControl>

                <HStack space="md">
                  <Button
                    variant="outline"
                    onPress={onClose}
                    className="flex-1 border-outline-200"
                  >
                    <ButtonText>Cancel</ButtonText>
                  </Button>
                  <Button onPress={onClose} className="flex-1">
                    <ButtonText>Save Changes</ButtonText>
                  </Button>
                </HStack>
              </VStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </KeyboardAvoidingView>
    </Modal>
  );
}

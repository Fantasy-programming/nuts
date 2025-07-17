import React, { useState } from "react";
import { ProfileHeader } from "@/components/auth/profile/profile-header";
import { ProfileMenu } from "@/components/auth/profile/profile-menu";
import { ScrollView } from "@/components/ui/scroll-view";
import { SubscriptionStatus } from "@/components/auth/profile/subscription-status";
import { EditProfileModal } from "@/components/auth/profile/edit-profile";

export default function ProfilePage() {
  const [showEditProfile, setShowEditProfile] = useState(false);

  return (
    <ScrollView className="flex-1 bg-background dark:bg-background-dark">
      <ProfileHeader onEditPress={() => setShowEditProfile(true)} />
      <SubscriptionStatus />
      <ProfileMenu />
      <EditProfileModal
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
      />
    </ScrollView>
  );
}

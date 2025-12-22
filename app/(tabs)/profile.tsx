import React from "react";
import { View, Text, TouchableOpacity, Image, ScrollView, Alert } from "react-native";
import { useUser, useClerk } from "@clerk/clerk-expo";

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();

  const handleLogout = async () => {
    try {
      await signOut();
      Alert.alert("Logged out", "You have been signed out successfully");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <ScrollView className="flex-1 bg-black">
      <View className="items-center justify-center py-10">
        {/* User Avatar */}
        {user?.imageUrl ? (
          <Image
            source={{ uri: user.imageUrl }}
            className="w-24 h-24 rounded-full mb-4"
          />
        ) : (
          <View className="w-24 h-24 rounded-full bg-gray-700 mb-4 items-center justify-center">
            <Text className="text-white text-xl">?</Text>
          </View>
        )}

        {/* User Name */}
        <Text className="text-2xl font-bold text-white mb-2">
          {user?.firstName || "User"}
        </Text>

        <Text className="text-gray-400">{user?.emailAddresses?.[0]?.emailAddress}</Text>
      </View>

      {/* Tabs / Options */}
      <View className="mt-8">
        <TouchableOpacity
          className="px-5 py-4 border-b border-gray-700"
          onPress={() => Alert.alert("Account Settings", "Navigate to Account Settings")}
        >
          <Text className="text-white text-lg">Account Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="px-5 py-4 border-b border-gray-700"
          onPress={() => Alert.alert("History", "Navigate to History")}
        >
          <Text className="text-white text-lg">History</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="px-5 py-4 border-b border-gray-700"
          onPress={handleLogout}
        >
          <Text className="text-red-500 text-lg">Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

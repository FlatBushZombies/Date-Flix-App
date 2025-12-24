import React from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useUser, useClerk } from "@clerk/clerk-expo";
import { Film, Users, Heart, Clock } from "lucide-react-native";

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();

  const handleLogout = async () => {
    try {
      await signOut();
      Alert.alert("Signed out", "You have been logged out successfully");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      {/* Header */}
      <View className="items-center px-6 pt-14 pb-6">
        <Text className="text-2xl font-semibold text-gray-900">
          Movie Circle
        </Text>
        <Text className="text-sm text-gray-500 mt-1 text-center">
          Match, watch, and enjoy movies together
        </Text>
      </View>

      {/* Avatar Cluster */}
      <View className="items-center mb-6">
        <View className="flex-row items-center space-x-4">
          {/* Placeholder left */}
          <View className="w-14 h-14 rounded-full bg-gray-200 items-center justify-center">
            <Users size={20} className="text-gray-400" />
          </View>

          {/* Main User Avatar */}
          {user?.imageUrl ? (
            <Image
              source={{ uri: user.imageUrl }}
              className="w-20 h-20 rounded-full border-2 border-gray-300"
            />
          ) : (
            <View className="w-20 h-20 rounded-full bg-gray-300 items-center justify-center">
              <Text className="text-xl text-white">?</Text>
            </View>
          )}

          {/* Placeholder right */}
          <View className="w-14 h-14 rounded-full bg-gray-200 items-center justify-center">
            <Heart size={20} className="text-gray-400" />
          </View>
        </View>

        {/* Username */}
        <Text className="mt-4 text-lg font-semibold text-gray-900">
          {user?.username || user?.firstName || "User"}
        </Text>

        <Text className="text-sm text-gray-500">
          Ready to pair a movie 🎬
        </Text>
      </View>

      {/* Activity / Streak */}
      <View className="mx-6 mb-6 rounded-2xl bg-gray-50 px-4 py-3 flex-row items-center justify-center">
        <Clock size={16} className="text-red-400 mr-2" />
        <Text className="text-sm text-red-500 font-medium">
          You’ve paired movies 3 days in a row
        </Text>
      </View>

      {/* Movie Pairing Actions */}
      <View className="mx-6 space-y-4">
        <ActionCard
          title="Movie Match"
          description="Swipe and match movies with a friend"
          action="Start"
          icon={<Film size={20} className="text-gray-700" />}
        />

        <ActionCard
          title="Watch Together"
          description="Create a synced movie night"
          action="Create"
          icon={<Users size={20} className="text-gray-700" />}
        />

        <ActionCard
          title="Shared Watchlist"
          description="Save movies you both want to see"
          action="Open"
          icon={<Heart size={20} className="text-gray-700" />}
        />
      </View>

      {/* Footer Actions */}
      <View className="mt-10 mx-6 border-t border-gray-200">
        <TouchableOpacity
          className="py-4"
          onPress={() =>
            Alert.alert("Account", "Account settings coming soon")
          }
        >
          <Text className="text-gray-700 text-base">Account Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity className="py-4" onPress={handleLogout}>
          <Text className="text-red-500 text-base">Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Components                                 */
/* -------------------------------------------------------------------------- */

function ActionCard({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action: string;
  icon: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center justify-between bg-gray-50 rounded-2xl px-4 py-4">
      <View className="flex-row items-center space-x-3">
        <View className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm">
          {icon}
        </View>

        <View>
          <Text className="text-base font-medium text-gray-900">
            {title}
          </Text>
          <Text className="text-sm text-gray-500">
            {description}
          </Text>
        </View>
      </View>

      <TouchableOpacity className="px-4 py-2 rounded-full bg-white border border-gray-200">
        <Text className="text-sm font-medium text-gray-800">
          {action}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

import { Tabs } from "expo-router"
import { Film, User, BookMarked, Plus } from "lucide-react-native"
import { View, TouchableOpacity, StyleSheet, GestureResponderEvent } from "react-native"

function DiscoverButton({ onPress }: { onPress: (e: GestureResponderEvent) => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.discoverWrapper} activeOpacity={0.85}>
      <View style={styles.discoverGlow} />
      <View style={styles.discoverButton}>
        <Plus color="#FFFFFF" size={26} strokeWidth={2.5} />
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  discoverWrapper: {
    alignItems: "center",
    justifyContent: "center",
    top: -22,
    width: 72,
    height: 72,
  },
  discoverGlow: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#E50914",
    opacity: 0.25,
    transform: [{ scale: 1.3 }],
  },
  discoverButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E50914",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E50914",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 12,
    borderWidth: 3,
    borderColor: "#FF3B47",
  },
})

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0A0A0A",
          borderTopWidth: 0,
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.6,
          shadowRadius: 20,
          elevation: 20,
        },
        tabBarActiveTintColor: "#E50914",
        tabBarInactiveTintColor: "#3D3D3D",
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          letterSpacing: 0.8,
          textTransform: "uppercase",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Film color={color} size={size} />,
        }}
      />

      <Tabs.Screen
        name="match"
        options={{
          title: "Matches",
          tabBarIcon: ({ color, size }) => <BookMarked color={color} size={size} />,
        }}
      />

      <Tabs.Screen
        name="discover"
        options={{
          title: "",
          tabBarIcon: () => null,
          tabBarButton: (props) => (
            <DiscoverButton onPress={(e) => props.onPress?.(e)} />
          ),
        }}
      />

      <Tabs.Screen
        name="saved"
        options={{
          title: "Saved",
          tabBarIcon: ({ color, size }) => <BookMarked color={color} size={size} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  )
}
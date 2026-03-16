import { Tabs } from "expo-router"
import { Film, User, BookMarked, Plus } from "lucide-react-native"
import { View, TouchableOpacity, StyleSheet, GestureResponderEvent } from "react-native"
import Svg, { Path } from "react-native-svg"

function SwordsIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14.5 17.5L3 6V3h3l11.5 11.5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M13 19l6-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 16l4 4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M19 21l2-2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9.5 6.5L3 13l4 4 1.5-1.5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 3l18 18" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function DiscoverButton({ onPress }: { onPress: (e: GestureResponderEvent) => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.discoverWrapper} activeOpacity={0.85}>
      <View style={styles.discoverGlow} />
      <View style={styles.discoverPulse} />
      <View style={styles.discoverButton}>
        <Plus color="#FFFFFF" size={30} strokeWidth={3} />
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  discoverWrapper: {
    alignItems: "center",
    justifyContent: "center",
    top: -28,
    width: 80,
    height: 80,
  },
  discoverGlow: {
    position: "absolute",
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#E50914",
    opacity: 0.18,
    transform: [{ scale: 1.5 }],
  },
  discoverPulse: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#E50914",
    opacity: 0.35,
    transform: [{ scale: 1.15 }],
  },
  discoverButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#E50914",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E50914",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.75,
    shadowRadius: 20,
    elevation: 18,
    borderWidth: 3.5,
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
        name="debate"
        options={{
          title: "Debate",
          tabBarIcon: ({ color, size }) => <SwordsIcon color={color} size={size} />,
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
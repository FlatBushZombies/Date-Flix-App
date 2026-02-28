import { Stack } from "expo-router";

const Layout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" options={{ headerShown: false}} />
      <Stack.Screen name="post-auth" options={{ headerShown: false}}/>
    </Stack>
  );
};

export default Layout;

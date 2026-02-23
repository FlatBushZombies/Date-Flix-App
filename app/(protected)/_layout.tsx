import { Stack } from "expo-router";

const Layout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="post-auth" />
    </Stack>
  );
};

export default Layout;

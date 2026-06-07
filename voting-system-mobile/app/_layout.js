import React, { useEffect } from "react";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { I18nextProvider } from "react-i18next";
import { I18nManager } from "react-native";
import * as SplashScreen from "expo-splash-screen";

import i18n from "../src/i18n";
import { useAuthStore } from "../src/store/authStore";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const bootstrapping = useAuthStore((s) => s.bootstrapping);
  const user = useAuthStore((s) => s.user);

  // Force RTL for Arabic
  useEffect(() => {
    const isRtl = i18n.language === "ar";
    if (I18nManager.isRTL !== isRtl) {
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(isRtl);
    }
  }, []);

  useEffect(() => {
    bootstrap().then(() => {
      SplashScreen.hideAsync();
    });
  }, []);

  useEffect(() => {
    if (bootstrapping) return;
    if (!user) {
      router.replace("/login");
    } else {
      router.replace("/(tabs)");
    }
  }, [bootstrapping, user]);

  return (
    <I18nextProvider i18n={i18n}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="election/[id]"
          options={{
            headerShown: false,
            presentation: "card",
          }}
        />
        <Stack.Screen
          name="election/[id]/vote"
          options={{
            headerShown: false,
            presentation: "card",
          }}
        />
      </Stack>
    </I18nextProvider>
  );
}

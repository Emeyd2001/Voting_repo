import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { Home, Vote, BarChart3, User } from "lucide-react-native";
import { Colors } from "../../src/theme/colors";
import i18n from "../../src/i18n";

function CustomTabBar({ state, descriptors, navigation }) {
  const { i18n: i18nInstance } = useTranslation();
  const isArabic = i18nInstance.language === "ar";

  const tabs = state.routes.map((route, index) => ({ route, index }));

  return (
    <View style={[styles.tabBar, { direction: isArabic ? "rtl" : "ltr" }]}>
      {tabs.map(({ route, index }) => {
        const { options } = descriptors[route.key];
        const label = options.title ?? route.name;
        const isFocused = state.index === index;

        const color = isFocused ? Colors.tabActive : Colors.tabInactive;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        const icon = options.tabBarIcon
          ? options.tabBarIcon({ color, size: 22, focused: isFocused })
          : null;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabItem}
          >
            {icon}
            <Text
              style={[
                styles.tabLabel,
                { color },
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.tabActive,
        tabBarInactiveTintColor: Colors.tabInactive,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("nav.home"),
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="elections"
        options={{
          title: t("nav.elections"),
          tabBarIcon: ({ color, size }) => <Vote size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="results"
        options={{
          title: t("nav.results"),
          tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("nav.myProfile"),
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    backgroundColor: Colors.tabBar,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: 6,
    paddingTop: 6,
    height: 60,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
});

import React from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Colors } from "../../theme/colors";

export function LoadingState({ message }) {
  const { t } = useTranslation();
  const displayMessage = message || t("common.loading");

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.text}>{displayMessage}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 48,
  },
  text: {
    fontSize: 14,
    color: Colors.muted,
    fontWeight: "500",
  },
});

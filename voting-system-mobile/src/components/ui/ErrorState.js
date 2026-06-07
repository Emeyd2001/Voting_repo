import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { AlertTriangle } from "lucide-react-native";
import { Colors, Shadows } from "../../theme/colors";

export function ErrorState({ error, onRetry }) {
  const message =
    error?.message || error?.toString() || "حدث خطأ غير متوقع";
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <AlertTriangle size={32} color={Colors.warning} />
      </View>
      <Text style={styles.title}>حدث خطأ</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <Pressable style={styles.btn} onPress={onRetry}>
          <Text style={styles.btnText}>إعادة المحاولة</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.warningLight,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.onSurface,
  },
  message: {
    fontSize: 13,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 20,
  },
  btn: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    ...Shadows.sm,
  },
  btnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});

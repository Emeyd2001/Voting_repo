import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { statusStyle, labelStatus } from "../../lib/status";

export function StatusBadge({ status, t }) {
  const style = statusStyle(status);
  const label = labelStatus(status, t);
  return (
    <View style={[styles.badge, { backgroundColor: style.bg, borderColor: style.border }]}>
      {status === "active" && <View style={[styles.dot, { backgroundColor: style.color }]} />}
      <Text style={[styles.text, { color: style.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    gap: 5,
    alignSelf: "flex-start",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 11,
    fontWeight: "700",
  },
});

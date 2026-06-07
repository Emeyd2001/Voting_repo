import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../../theme/colors";

export function EmptyState({ icon: Icon, label, subtitle }) {
  return (
    <View style={styles.container}>
      {Icon && (
        <View style={styles.iconWrap}>
          <Icon size={32} color={Colors.muted} />
        </View>
      )}
      <Text style={styles.label}>{label}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 10,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.secondary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: Colors.muted,
    textAlign: "center",
  },
});

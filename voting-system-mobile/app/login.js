import React, { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image
} from "react-native";
import { useTranslation } from "react-i18next";
import { ShieldCheck } from "lucide-react-native";
import { useAuthStore } from "../src/store/authStore";
import { Colors, Shadows } from "../src/theme/colors";

export default function LoginScreen() {
  const { t, i18n } = useTranslation();
  const login = useAuthStore((s) => s.login);

  const [nni, setNni] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "ar" ? "fr" : "ar");
  };

  const handleLogin = async () => {
    if (!nni.trim()) {
      setError(t("auth.nniRequired"));
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(nni.trim());
      // Navigation handled by _layout.js auth guard
    } catch (err) {
      setError(err?.message ?? t("auth.loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Language Switcher */}
        <Pressable style={styles.langBtn} onPress={toggleLanguage}>
          <Text style={styles.langText}>{i18n.language === "ar" ? "Français" : "العربية"}</Text>
        </Pressable>
        {/* Header Banner */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Image 
              source={require("../assets/icon.png")} 
              style={styles.logoImage} 
              resizeMode="contain"
            />
          </View>
          <Text style={styles.republic}>{t("auth.republic")}</Text>
          <Text style={styles.motto}>{t("auth.motto")}</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.title}>{t("auth.pageTitle")}</Text>
          <Text style={styles.subtitle}>{t("auth.ministry")}</Text>

          <View style={styles.divider} />

          {/* NNI Input */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>{t("auth.nniLabel")}</Text>
            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              placeholder={t("auth.nniPlaceholder")}
              placeholderTextColor={Colors.muted}
              value={nni}
              onChangeText={(v) => { setNni(v.replace(/\D/g, "")); setError(""); }}
              keyboardType="numeric"
              maxLength={10}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              textAlign="right"
            />
            {!!error && <Text style={styles.errorText}>{error}</Text>}
          </View>

          {/* Submit */}
          <Pressable
            style={({ pressed }) => [styles.btn, pressed && styles.btnPressed, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.btnText}>{t("auth.loginBtn")}</Text>
            )}
          </Pressable>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>{t("footer.rights")}</Text>
      </ScrollView>

      {/* Background decoration */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 20,
  },
  header: { alignItems: "center", gap: 8, marginBottom: 4 },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    overflow: "hidden",
    ...Shadows.md,
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  republic: {
    fontSize: 17,
    fontWeight: "900",
    color: Colors.primary,
    textAlign: "center",
  },
  motto: {
    fontSize: 12,
    color: Colors.secondary,
    textAlign: "center",
    fontWeight: "500",
  },
  card: {
    width: "100%",
    backgroundColor: Colors.surfaceCard,
    borderRadius: 24,
    padding: 24,
    gap: 16,
    ...Shadows.md,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: Colors.onSurface,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 12,
    color: Colors.muted,
    textAlign: "center",
    marginTop: -8,
  },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 4 },
  fieldWrap: { gap: 6 },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.onSurfaceVariant,
    textAlign: "right",
  },
  input: {
    height: 52,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.onSurface,
    backgroundColor: Colors.surface,
    textAlign: "right",
  },
  inputError: { borderColor: Colors.error },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    fontWeight: "600",
    textAlign: "right",
  },
  btn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.lg,
  },
  btnPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  footer: {
    fontSize: 11,
    color: Colors.muted,
    textAlign: "center",
    marginTop: 8,
  },
  blob1: {
    position: "absolute", top: -60, right: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: Colors.primaryLight, opacity: 0.5, zIndex: -1,
  },
  blob2: {
    position: "absolute", bottom: -40, left: -40,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: Colors.accentLight, opacity: 0.4, zIndex: -1,
  },
  langBtn: {
    position: "absolute",
    top: 40,
    right: 20,
    padding: 8,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 8,
    ...Shadows.sm,
    zIndex: 10,
  },
  langText: {
    color: Colors.primary,
    fontWeight: "bold",
    fontSize: 14,
  },
});

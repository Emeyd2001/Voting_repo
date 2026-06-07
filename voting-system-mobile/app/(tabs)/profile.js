import React, { useMemo } from "react";
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  SafeAreaView, Alert, I18nManager
} from "react-native";
import { useTranslation } from "react-i18next";
import {
  User, ShieldAlert, LogOut, CheckCircle2,
  Globe, Smartphone, Calendar, MapPin, Hash, UserCheck
} from "lucide-react-native";

import { useAuthStore } from "../../src/store/authStore";
import { useMyVotes, useElections } from "../../src/hooks/useResource";
import { WILAYAS } from "../../src/lib/wilayas";
import { Colors, Shadows } from "../../src/theme/colors";
import i18n from "../../src/i18n";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const isRtl = i18n.language === "ar";
  
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  
  const myVotesQ = useMyVotes();
  const electionsQ = useElections();

  const myVotes = useMemo(() => myVotesQ.data ?? [], [myVotesQ.data]);
  const elections = useMemo(() => electionsQ.data ?? [], [electionsQ.data]);

  const activeElectionsCount = useMemo(() => {
    return elections.filter(e => e.status === "active").length;
  }, [elections]);

  const participationRate = useMemo(() => {
    if (elections.length === 0) return 0;
    return (myVotes.length / elections.length) * 100;
  }, [myVotes, elections]);

  const handleLogout = () => {
    Alert.alert(
      t("common_extra.logoutTitle"),
      t("common_extra.logoutConfirm"),
      [
        { text: t("common_extra.cancel"), style: "cancel" },
        {
          text: t("common_extra.logout"),
          style: "destructive",
          onPress: async () => {
            await logout();
          }
        }
      ]
    );
  };

  const toggleLanguage = async () => {
    const currentLang = i18n.language;
    const newLang = currentLang === "ar" ? "fr" : "ar";
    
    // Change language in i18next
    await i18n.changeLanguage(newLang);
    
    // Set RTL direction
    const shouldBeRtl = newLang === "ar";
    if (I18nManager.isRTL !== shouldBeRtl) {
      I18nManager.allowRTL(shouldBeRtl);
      I18nManager.forceRTL(shouldBeRtl);

      Alert.alert(
        t("common_extra.languageRestartTitle"),
        t("common_extra.languageRestartDesc"),
        [{ text: t("common_extra.ok") }]
      );
    }
  };

  const userWilaya = useMemo(() => {
    if (!user?.wilaya) return "";
    const found = WILAYAS.find(w => w.value === user.wilaya);
    return isRtl ? (found?.label ?? user.wilaya) : (found?.value ?? user.wilaya);
  }, [user, isRtl]);

  const personalDataFields = [
    { icon: User, label: t("voterProfile.fullName"), value: user?.full_name },
    { icon: Hash, label: t("voterProfile.nni"), value: user?.nni },
    { icon: MapPin, label: t("voterProfile.wilaya"), value: userWilaya },
    { icon: Smartphone, label: t("voterProfile.phone"), value: user?.phone ?? "---" },
    { icon: Calendar, label: t("voterProfile.dateOfBirth"), value: user?.date_of_birth ?? "---" },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarBg}>
              <User size={38} color={Colors.primary} />
            </View>
            <View style={styles.badgeContainer}>
              <UserCheck size={12} color="#fff" />
            </View>
          </View>
          
          <Text style={styles.profileName}>{user?.full_name}</Text>
          <Text style={styles.profileStatus}>{t("voterProfile.registeredVoter")}</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {[
            {
              value: myVotes.length,
              label: t("voterProfile.participated"),
              desc: t("voterProfile.elections"),
            },
            {
              value: `${Math.round(participationRate)}%`,
              label: t("voterProfile.participationRate"),
              desc: t("voterProfile.fromAvailable"),
            },
            {
              value: activeElectionsCount,
              label: t("voterProfile.availableElections"),
              desc: t("status.active"),
            },
          ].map((stat, i) => (
            <View key={i} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statDesc}>{stat.desc}</Text>
            </View>
          ))}
        </View>

        {/* Personal Info */}
        <View style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { textAlign: isRtl ? "right" : "left" }]}>
            {t("voterProfile.personalData")}
          </Text>
          <View style={styles.fieldsWrap}>
            {personalDataFields.map((field, i) => {
              const Icon = field.icon;
              return (
                <View
                  key={i}
                  style={[
                    styles.fieldRow,
                    { flexDirection: isRtl ? "row-reverse" : "row" },
                    i < personalDataFields.length - 1 && styles.fieldBorder
                  ]}
                >
                  <View style={[styles.fieldLabelWrap, { flexDirection: isRtl ? "row-reverse" : "row" }]}>
                    <Icon size={16} color={Colors.secondary} />
                    <Text style={styles.fieldLabel}>{field.label}</Text>
                  </View>
                  <Text style={styles.fieldValue}>{field.value}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Settings / Actions */}
        <View style={styles.sectionCard}>
          {/* Language Switch */}
          <Pressable
            style={({ pressed }) => [
              styles.actionRow,
              pressed && styles.actionRowPressed,
              { flexDirection: isRtl ? "row-reverse" : "row" }
            ]}
            onPress={toggleLanguage}
          >
            <View style={[styles.actionLabelWrap, { flexDirection: isRtl ? "row-reverse" : "row" }]}>
              <Globe size={18} color={Colors.primary} />
              <Text style={styles.actionLabel}>
                {t("voterProfile.switchLanguage")}
              </Text>
            </View>
            <View style={styles.langPill}>
              <Text style={styles.langPillText}>
                {isRtl ? "AR" : "FR"}
              </Text>
            </View>
          </Pressable>

          <View style={styles.divider} />

          {/* Secure Identity */}
          <View style={[styles.secureBanner, { flexDirection: isRtl ? "row-reverse" : "row" }]}>
            <ShieldAlert size={18} color={Colors.success} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.secureTitle, { textAlign: isRtl ? "right" : "left" }]}>
                {t("voterProfile.dataProtection")}
              </Text>
              <Text style={[styles.secureDesc, { textAlign: isRtl ? "right" : "left" }]}>
                {t("voterProfile.dataProtectionDesc")}
              </Text>
            </View>
          </View>
        </View>

        {/* Participation History */}
        {myVotes.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { textAlign: isRtl ? "right" : "left" }]}>
              {t("voterProfile.voteHistory")}
            </Text>
            <View style={styles.historyWrap}>
              {myVotes.map((v, i) => (
                <View
                  key={v.id ?? i}
                  style={[
                    styles.historyItem,
                    { flexDirection: isRtl ? "row-reverse" : "row" },
                    i < myVotes.length - 1 && styles.fieldBorder
                  ]}
                >
                  <View style={styles.historyIcon}>
                    <CheckCircle2 size={16} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1, alignItems: isRtl ? "flex-end" : "flex-start", gap: 2 }}>
                    <Text style={styles.historyTitle} numberOfLines={1}>
                      {elections.find(e => e.id === v.election)?.title || t("voter.defaultName")}
                    </Text>
                    <Text style={styles.historyDate}>
                      {t("voterProfile.voted")} — {new Date(v.created_at).toLocaleDateString(isRtl ? "ar-EG" : "fr-FR")}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Logout */}
        <Pressable
          style={({ pressed }) => [
            styles.logoutBtn,
            pressed && styles.logoutBtnPressed,
            { flexDirection: isRtl ? "row-reverse" : "row" }
          ]}
          onPress={handleLogout}
        >
          <LogOut size={18} color={Colors.error} />
          <Text style={styles.logoutBtnText}>{t("voterProfile.logout")}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 8,
    paddingBottom: 64,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  profileCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 24,
    paddingVertical: 24,
    marginTop: 28,
    alignItems: "center",
    gap: 10,
    ...Shadows.sm,
  },
  avatarContainer: {
    position: "relative",
  },
  avatarBg: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.sm,
  },
  badgeContainer: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: Colors.primary,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "#fff",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "900",
    color: Colors.onSurface,
  },
  profileStatus: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    gap: 2,
    ...Shadows.sm,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "900",
    color: Colors.onSurface,
  },
  statLabel: {
    fontSize: 9,
    color: Colors.secondary,
    fontWeight: "700",
    textAlign: "center",
  },
  statDesc: {
    fontSize: 9,
    color: Colors.muted,
    fontWeight: "500",
    textAlign: "center",
  },
  sectionCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 20,
    padding: 16,
    gap: 12,
    ...Shadows.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.onSurface,
    marginBottom: 4,
  },
  fieldsWrap: {
    gap: 12,
  },
  fieldRow: {
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  fieldBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainer,
  },
  fieldLabelWrap: {
    alignItems: "center",
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    color: Colors.secondary,
    fontWeight: "600",
  },
  fieldValue: {
    fontSize: 12,
    color: Colors.onSurface,
    fontWeight: "700",
  },
  actionRow: {
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
  },
  actionRowPressed: {
    backgroundColor: Colors.surfaceContainer,
  },
  actionLabelWrap: {
    alignItems: "center",
    gap: 10,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  langPill: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  langPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  secureBanner: {
    backgroundColor: Colors.successLight,
    padding: 12,
    borderRadius: 14,
    alignItems: "center",
    gap: 10,
  },
  secureTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.success,
  },
  secureDesc: {
    fontSize: 10,
    color: Colors.success,
    opacity: 0.8,
    marginTop: 2,
    lineHeight: 14,
  },
  historyWrap: {
    gap: 8,
  },
  historyItem: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  historyIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  historyTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  historyDate: {
    fontSize: 10,
    color: Colors.muted,
    fontWeight: "500",
  },
  logoutBtn: {
    backgroundColor: Colors.errorLight,
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...Shadows.sm,
  },
  logoutBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.error,
  },
});

import React, { useState, useMemo } from "react";
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  SafeAreaView, Image, ActivityIndicator, Alert
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  ShieldCheck, User, Vote, Check, AlertTriangle, CheckCircle2,
  ArrowLeft, ArrowRight, ShieldAlert, Cpu, LogOut
} from "lucide-react-native";

import { useElection, useElectionCandidates, useCastVote } from "../../../src/hooks/useResource";
import { useAuthStore } from "../../../src/store/authStore";
import { LoadingState } from "../../../src/components/ui/LoadingState";
import { ErrorState } from "../../../src/components/ui/ErrorState";
import CandidateAvatar from "../../../src/components/CandidateAvatar.js";
import { getImageUrl, candidateImageSource } from "../../../src/lib/utils";
import { WILAYAS } from "../../../src/lib/wilayas";
import { Colors, Shadows } from "../../../src/theme/colors";
import i18n from "../../../src/i18n";

export default function VoteScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const isRtl = i18n.language === "ar";

  const electionQ = useElection(id);
  const candidatesQ = useElectionCandidates(id);
  const castVoteQ = useCastVote();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const election = electionQ.data;
  const candidates = useMemo(() => candidatesQ.data ?? [], [candidatesQ.data]);

  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [step, setStep] = useState(1); // 1: Select candidate, 2: Confirm, 3: Success

  const selectedCandidate = useMemo(() => {
    return candidates.find((c) => c.id === selectedCandidateId);
  }, [candidates, selectedCandidateId]);

  const userWilaya = useMemo(() => {
    if (!user?.wilaya) return "";
    const found = WILAYAS.find(w => w.value === user.wilaya);
    return isRtl ? (found?.label ?? user.wilaya) : (found?.value ?? user.wilaya);
  }, [user, isRtl]);

  const handleNextStep = () => {
    if (!selectedCandidateId) {
      Alert.alert(
        t("votePage_extra.selectCandidateTitle"),
        t("votePage_extra.selectCandidateDesc")
      );
      return;
    }
    setStep(2);
  };

  const handleCastVote = async () => {
    try {
      await castVoteQ.mutate({ election: id, candidate: selectedCandidateId });
      setStep(3);
    } catch (err) {
      Alert.alert(
        t("votePage_extra.voteFailedTitle"),
        err?.message ?? t("votePage_extra.voteFailedDesc")
      );
    }
  };

  const loading = electionQ.loading || candidatesQ.loading;
  const error = electionQ.error || candidatesQ.error;

  if (loading) return <LoadingState />;
  if (error || !election) {
    return (
      <ErrorState
        error={error ?? new Error(t("votePage.invalidId"))}
        onRetry={() => {
          electionQ.refetch();
          candidatesQ.refetch();
        }}
      />
    );
  }

  // STEP 1: Select Candidate
  if (step === 1) {
    return (
      <SafeAreaView style={styles.root}>
        {/* Navbar */}
        <View style={[styles.navbar, { flexDirection: isRtl ? "row-reverse" : "row" }]}> 
          <Pressable
            style={({ pressed }) => [styles.navBackBtn, pressed && styles.btnPressed]}
            onPress={() => router.back()}
          >
            {isRtl ? (
              <ArrowRight size={20} color={Colors.onSurface} />
            ) : (
              <ArrowLeft size={20} color={Colors.onSurface} />
            )}
          </Pressable>
          <Text style={styles.navbarTitle} numberOfLines={1}>{election.title}</Text>
          <Pressable
            style={({ pressed }) => [styles.userBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  Alert.alert(
                    t("common_extra.logoutTitle"),
                    t("common_extra.logoutConfirm"),
                    [
                      { text: t("common_extra.cancel"), style: "cancel" },
                      { text: t("common_extra.logout"), style: "destructive", onPress: async () => { await logout(); } }
                    ]
                  );
                }}
          >
            <View style={styles.userAvatar}>
              {user?.avatar ? (
                <Image source={{ uri: getImageUrl(user.avatar) }} style={styles.userAvatarImg} />
              ) : (
                <User size={18} color={Colors.primary} />
              )}
            </View>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Banner */}
          <View style={styles.stepHeaderCard}>
            <View style={[styles.stepIndicator, { flexDirection: isRtl ? "row-reverse" : "row" }]}>
              <View style={[styles.stepDot, styles.stepDotActive]} />
              <View style={styles.stepLine} />
              <View style={styles.stepDot} />
              <View style={styles.stepLine} />
              <View style={styles.stepDot} />
            </View>
            <Text style={styles.stepTitle}>{t("votePage.ballotTitle")}</Text>
            <Text style={styles.stepSubtitle}>{t("votePage.secureSession")}</Text>
          </View>

          {/* Candidate Grid List */}
          <View style={styles.candidatesGrid}>
            {candidates.map((cand) => {
              const isSelected = cand.id === selectedCandidateId;
              return (
                <Pressable
                  key={cand.id}
                  style={[
                    styles.candidateCard,
                    isSelected && styles.candidateCardActive,
                  ]}
                  onPress={() => setSelectedCandidateId(cand.id)}
                >
                  <View style={styles.candidateAvatarWrap}>
                    <CandidateAvatar
                      candidate={cand}
                      candidateId={cand.id}
                      style={styles.candidateAvatar}
                      size={64}
                    />
                    {isSelected && (
                      <View style={styles.checkCircleBadge}>
                        <Check size={10} color="#fff" strokeWidth={3} />
                      </View>
                    )}
                  </View>
                  
                  <Text style={styles.candidateName} numberOfLines={2}>
                    {cand.full_name}
                  </Text>
                  <Text style={styles.candidateParty} numberOfLines={1}>
                    {cand.party_name || t("voter.defaultName")}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* Footer Next Button */}
        <View style={styles.stickyFooter}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && styles.btnPressed,
              !selectedCandidateId && styles.btnDisabled,
            ]}
            onPress={handleNextStep}
            disabled={!selectedCandidateId}
          >
            <Text style={styles.primaryBtnText}>{t("votePage.proceedToConfirm")}</Text>
            {isRtl ? (
              <ArrowLeft size={16} color="#fff" />
            ) : (
              <ArrowRight size={16} color="#fff" />
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // STEP 2: Confirm Selection
  if (step === 2) {
    return (
      <SafeAreaView style={styles.root}>
        {/* Navbar */}
        <View style={[styles.navbar, { flexDirection: isRtl ? "row-reverse" : "row" }]}>
          <Pressable
            style={({ pressed }) => [styles.navBackBtn, pressed && styles.btnPressed]}
            onPress={() => setStep(1)}
          >
            {isRtl ? (
              <ArrowRight size={20} color={Colors.onSurface} />
            ) : (
              <ArrowLeft size={20} color={Colors.onSurface} />
            )}
          </Pressable>
          <Text style={styles.navbarTitle}>{t("votePage.confirmTitle")}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Banner */}
          <View style={styles.stepHeaderCard}>
            <View style={[styles.stepIndicator, { flexDirection: isRtl ? "row-reverse" : "row" }]}>
              <View style={[styles.stepDot, styles.stepDotCompleted]} />
              <View style={[styles.stepLine, styles.stepLineCompleted]} />
              <View style={[styles.stepDot, styles.stepDotActive]} />
              <View style={styles.stepLine} />
              <View style={styles.stepDot} />
            </View>
            <Text style={styles.stepTitle}>{t("votePage.confirmTitle")}</Text>
            <Text style={styles.stepSubtitle}>{t("votePage.confirmDesc")}</Text>
          </View>

          {/* Warning Banner */}
          <View style={[styles.warningBanner, { flexDirection: isRtl ? "row-reverse" : "row" }]}>
            <AlertTriangle size={20} color={Colors.warning} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.warningText, { textAlign: isRtl ? "right" : "left" }]}>
                {t("votePage.confirmDesc")}
              </Text>
            </View>
          </View>

          {/* Voter Info Card */}
          <View style={styles.infoCard}>
            <Text style={[styles.cardHeaderTitle, { textAlign: isRtl ? "right" : "left" }]}>
              {t("votePage.voterData")}
            </Text>
            <View style={styles.divider} />
            <View style={styles.dataGrid}>
              {[
                { label: t("votePage.fullName"), value: user?.full_name },
                { label: t("votePage.nni"), value: user?.nni },
                { label: t("votePage.wilaya"), value: userWilaya },
              ].map((data, i) => (
                <View
                  key={i}
                  style={[
                    styles.dataRow,
                    { flexDirection: isRtl ? "row-reverse" : "row" },
                  ]}
                >
                  <Text style={styles.dataLabel}>{data.label}</Text>
                  <Text style={styles.dataValue}>{data.value}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Selected Candidate Card */}
          <View style={styles.selectedCandidateCard}>
            <Text style={[styles.cardHeaderTitle, { textAlign: isRtl ? "right" : "left" }]}>
              {t("votePage.yourCandidate")}
            </Text>
            <View style={styles.divider} />
            <View style={[styles.candidateInfoRow, { flexDirection: isRtl ? "row-reverse" : "row" }]}>
              <Image
                source={
                  candidateImageSource(selectedCandidate) || require("../../../assets/icon.png")
                }
                style={styles.selectedCandidateAvatar}
              />
              <View style={[styles.selectedCandidateInfo, { alignItems: isRtl ? "flex-end" : "flex-start" }]}>
                <Text style={styles.selectedCandidateName}>{selectedCandidate?.full_name}</Text>
                <Text style={styles.selectedCandidateParty}>
                  {selectedCandidate?.party_name || t("voter.defaultName")}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.stickyConfirmFooter}>
          <Pressable
            style={({ pressed }) => [
              styles.confirmBtn,
              pressed && styles.btnPressed,
              castVoteQ.loading && styles.btnDisabled,
            ]}
            onPress={handleCastVote}
            disabled={castVoteQ.loading}
          >
            {castVoteQ.loading ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.confirmBtnText}>{t("votePage.encrypting")}</Text>
              </View>
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <ShieldCheck size={18} color="#fff" />
                <Text style={styles.confirmBtnText}>{t("votePage.confirmVote")}</Text>
              </View>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.cancelBtn, pressed && styles.btnPressed]}
            onPress={() => setStep(1)}
            disabled={castVoteQ.loading}
          >
            <Text style={styles.cancelBtnText}>{t("votePage.goBack")}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // STEP 3: Success Screen
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.successContainer}>
        <View style={styles.successIconOuter}>
          <View style={styles.successIconInner}>
            <CheckCircle2 size={48} color="#fff" />
          </View>
        </View>

        <Text style={styles.successTitle}>{t("votePage.voteSentTitle")}</Text>
        <Text style={styles.successSubtitle}>{t("votePage.voteSentDesc")}</Text>

        {/* Encryption Details */}
        <View style={styles.encryptionCard}>
          <Cpu size={24} color={Colors.primary} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.encryptionCardTitle}>{t("voter.secureIdentity")}</Text>
            <Text style={styles.encryptionCardDesc}>SHA-256 / AES-256 End-To-End Encrypted & Audited by CENI.</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.successHomeBtn, pressed && styles.btnPressed]}
          onPress={() => router.replace("/(tabs)")}
        >
          <Text style={styles.successHomeBtnText}>{t("votePage.backToHome")}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  navbar: {
    height: 56,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    ...Shadows.sm,
  },
  navBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  navbarTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.onSurface,
    flex: 1,
    textAlign: "center",
    marginHorizontal: 10,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 24,
  },
  stepHeaderCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    gap: 8,
    ...Shadows.sm,
  },
  stepIndicator: {
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.border,
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
    transform: [{ scale: 1.2 }],
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  stepDotCompleted: {
    backgroundColor: Colors.primary,
  },
  stepLine: {
    width: 32,
    height: 2,
    backgroundColor: Colors.border,
  },
  stepLineCompleted: {
    backgroundColor: Colors.primary,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: Colors.onSurface,
  },
  stepSubtitle: {
    fontSize: 11,
    color: Colors.muted,
    fontWeight: "600",
    textAlign: "center",
  },
  candidatesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  candidateCard: {
    width: "48%",
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: "transparent",
    ...Shadows.sm,
  },
  candidateCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  candidateAvatarWrap: {
    position: "relative",
  },
  candidateAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.surfaceContainer,
  },
  checkCircleBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: Colors.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  candidateName: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.onSurface,
    textAlign: "center",
    lineHeight: 16,
  },
  candidateParty: {
    fontSize: 10,
    color: Colors.muted,
    textAlign: "center",
    fontWeight: "600",
  },
  stickyFooter: {
    padding: 16,
    backgroundColor: Colors.surfaceCard,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadows.md,
  },
  primaryBtn: {
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...Shadows.lg,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "850",
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  btnDisabled: {
    opacity: 0.6,
  },
  warningBanner: {
    backgroundColor: Colors.warningLight,
    borderWidth: 1,
    borderColor: "#FCD34D",
    padding: 14,
    borderRadius: 16,
    alignItems: "center",
    gap: 10,
  },
  warningText: {
    fontSize: 12,
    fontWeight: "750",
    color: Colors.warning,
    lineHeight: 18,
  },
  infoCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 20,
    padding: 16,
    gap: 12,
    ...Shadows.sm,
  },
  cardHeaderTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.onSurface,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  dataGrid: {
    gap: 8,
  },
  dataRow: {
    justifyContent: "space-between",
    alignItems: "center",
  },
  dataLabel: {
    fontSize: 11,
    color: Colors.secondary,
    fontWeight: "600",
  },
  dataValue: {
    fontSize: 11,
    color: Colors.onSurface,
    fontWeight: "700",
  },
  selectedCandidateCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  candidateInfoRow: {
    alignItems: "center",
    gap: 14,
  },
  selectedCandidateAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surfaceContainer,
  },
  selectedCandidateInfo: {
    flex: 1,
    gap: 2,
  },
  selectedCandidateName: {
    fontSize: 14,
    fontWeight: "850",
    color: Colors.onSurface,
  },
  selectedCandidateParty: {
    fontSize: 11,
    color: Colors.muted,
    fontWeight: "600",
  },
  userBtn: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: Colors.surfaceContainer,
  },
  userAvatarImg: {
    width: "100%",
    height: "100%",
  },
  stickyConfirmFooter: {
    padding: 16,
    backgroundColor: Colors.surfaceCard,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
    ...Shadows.md,
  },
  confirmBtn: {
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.lg,
  },
  confirmBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "850",
  },
  cancelBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: "750",
    color: Colors.secondary,
  },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 20,
  },
  successIconOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.successLight,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.sm,
  },
  successIconInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.md,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: Colors.onSurface,
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 13,
    color: Colors.secondary,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 10,
    fontWeight: "550",
  },
  encryptionCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    width: "100%",
    ...Shadows.sm,
  },
  encryptionCardTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.primary,
  },
  encryptionCardDesc: {
    fontSize: 10,
    color: Colors.muted,
    fontWeight: "600",
    lineHeight: 14,
  },
  successHomeBtn: {
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginTop: 10,
    ...Shadows.lg,
  },
  successHomeBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "850",
  },
});

import React, { useMemo } from "react";
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  SafeAreaView, Image, ActivityIndicator, Alert
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  ChevronLeft, ChevronRight, Calendar, Info,
  Users, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, BarChart3, Vote,
  User, LogOut
} from "lucide-react-native";

import { useElection, useElectionCandidates, useMyVotes, useRegistrationStatus, useRegister } from "../../src/hooks/useResource";
import { useAuthStore } from "../../src/store/authStore";
import { LoadingState } from "../../src/components/ui/LoadingState";
import { ErrorState } from "../../src/components/ui/ErrorState";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { StatusBadge } from "../../src/components/ui/StatusBadge";
import CandidateAvatar from "../../src/components/CandidateAvatar.js";
import { getImageUrl, candidateImageSource } from "../../src/lib/utils";
import { formatDate } from "../../src/lib/status";
import { Colors, Shadows } from "../../src/theme/colors";
import i18n from "../../src/i18n";

export default function ElectionDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const isRtl = i18n.language === "ar";

  const electionQ = useElection(id);
  const candidatesQ = useElectionCandidates(id);
  const myVotesQ = useMyVotes();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const election = electionQ.data;
  const candidates = useMemo(() => candidatesQ.data ?? [], [candidatesQ.data]);
  const myVotes = useMemo(() => myVotesQ.data ?? [], [myVotesQ.data]);

  // Registration status + mutation
  const registrationQ = useRegistrationStatus(id);
  const registerMut = useRegister();
  const isRegistered = registrationQ.data?.registered ?? false;

  const hasVoted = useMemo(() => {
    return myVotes.some((v) => String(v.election) === String(id));
  }, [myVotes, id]);

  const loading = electionQ.loading || candidatesQ.loading || myVotesQ.loading;
  const error = electionQ.error || candidatesQ.error || myVotesQ.error;

  if (loading) return <LoadingState />;
  if (error || !election) {
    return (
      <ErrorState
        error={error ?? new Error(t("votePage.invalidId"))}
        onRetry={() => {
          electionQ.refetch();
          candidatesQ.refetch();
          myVotesQ.refetch();
        }}
      />
    );
  }

  const isClosed = election.status === "closed" || election.status === "archived";
  const isActive = election.status === "active";
  const isScheduled = election.status === "scheduled";

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/elections");
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Top Navbar */}
      <View style={[styles.navbar, { flexDirection: isRtl ? "row-reverse" : "row" }]}> 
        <Pressable
          style={({ pressed }) => [styles.navBackBtn, pressed && styles.btnPressed]}
          onPress={handleBack}
        >
          {isRtl ? (
            <ArrowRight size={20} color={Colors.onSurface} />
          ) : (
            <ArrowLeft size={20} color={Colors.onSurface} />
          )}
        </Pressable>
        <Text style={styles.navbarTitle}>{t("voterElectionDetail.electionInfo")}</Text>
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
        {/* Main Card */}
        <View style={styles.detailCard}>
          <View style={[styles.cardHeader, { flexDirection: isRtl ? "row-reverse" : "row" }]}>
            <StatusBadge status={election.status} t={t} />
            {hasVoted && (
              <View style={styles.votedBadge}>
                <Text style={styles.votedBadgeText}>{t("voterElections.voted")}</Text>
              </View>
            )}
          </View>

          <Text style={[styles.electionTitle, { textAlign: isRtl ? "right" : "left" }]}>
            {election.title}
          </Text>

          {election.description ? (
            <Text style={[styles.electionDesc, { textAlign: isRtl ? "right" : "left" }]}>
              {election.description}
            </Text>
          ) : null}

          <View style={styles.divider} />

          {/* Dates */}
          <View style={styles.datesRow}>
            {[
              { label: t("voter.startLabel"), date: election.start_date },
              { label: t("voter.endLabel"), date: election.end_date },
            ].map((d, index) => (
              <View key={index} style={styles.dateItem}>
                <Calendar size={14} color={Colors.primary} />
                <View style={{ alignItems: "center", gap: 1 }}>
                  <Text style={styles.dateLabel}>{d.label}</Text>
                  <Text style={styles.dateValue}>{formatDate(d.date, true)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Voting Action Banner */}
        {isActive && !hasVoted && (
          <Pressable
            style={({ pressed }) => [styles.actionBanner, styles.actionBannerPrimary, pressed && styles.btnPressed]}
            onPress={() => router.push(`/election/${id}/vote`)}
          >
            <Vote size={22} color="#fff" />
            <View style={{ flex: 1 }}>
              <Text style={styles.actionBannerTitle}>{t("voter.voteNow")}</Text>
              <Text style={styles.actionBannerSub}>{t("votePage.secureSession")}</Text>
            </View>
            {isRtl ? (
              <ChevronLeft size={20} color="#fff" />
            ) : (
              <ChevronRight size={20} color="#fff" />
            )}
          </Pressable>
        )}

        {hasVoted && (
          <View style={[styles.actionBanner, styles.actionBannerSuccess]}>
            <CheckCircle2 size={22} color={Colors.success} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionBannerTitle, { color: Colors.success }]}>
                {t("voterElectionDetail.alreadyVoted")}
              </Text>
              <Text style={[styles.actionBannerSub, { color: Colors.success, opacity: 0.8 }]}>
                {t("voterElectionDetail.votedBadge")}
              </Text>
            </View>
          </View>
        )}

        {isClosed && (
          <Pressable
            style={({ pressed }) => [styles.actionBanner, styles.actionBannerInfo, pressed && styles.btnPressed]}
            onPress={() => router.replace("/(tabs)/results")}
          >
            <BarChart3 size={22} color={Colors.info} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionBannerTitle, { color: Colors.info }]}>
                {t("voterResults.title")}
              </Text>
              <Text style={[styles.actionBannerSub, { color: Colors.info, opacity: 0.95, textDecorationLine: 'underline', fontWeight: '800' }]}> 
                {t("voterResults.viewAllElections")}
              </Text>
            </View>
            {isRtl ? (
              <ChevronLeft size={20} color={Colors.info} />
            ) : (
              <ChevronRight size={20} color={Colors.info} />
            )}
          </Pressable>
        )}

        {isScheduled && (
          registrationQ.loading ? (
            <View style={[styles.actionBanner, styles.actionBannerWarning]}>
              <ActivityIndicator color={Colors.warning} />
            </View>
          ) : isRegistered ? (
            <View style={[styles.actionBanner, styles.actionBannerWarning]}>
              <Calendar size={22} color={Colors.warning} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionBannerTitle, { color: Colors.warning }]}> 
                  {t("voterElectionDetail.registrationTitle")}
                </Text>
                <Text style={[styles.actionBannerSub, { color: Colors.warning, opacity: 0.8 }]}> 
                  {t("voterElectionDetail.alreadyRegistered")}
                </Text>
              </View>
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.actionBanner, styles.actionBannerPrimary, pressed && styles.btnPressed]}
              onPress={async () => {
                try {
                  await registerMut.mutate(id);
                  Alert.alert(t("voterElectionDetail.registrationSuccess"));
                  registrationQ.refetch();
                } catch (err) {
                  Alert.alert(t("common.error"), err?.message ?? String(err));
                }
              }}
            >
              <Calendar size={22} color="#fff" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionBannerTitle, { color: "#fff" }]}>
                  {t("voterElectionDetail.registrationTitle")}
                </Text>
                <Text style={[styles.actionBannerSub, { color: "rgba(255,255,255,0.9)" }]}> 
                  {t("voterElectionDetail.registerNow")}
                </Text>
              </View>
              {isRtl ? (
                <ChevronLeft size={20} color="#fff" />
              ) : (
                <ChevronRight size={20} color="#fff" />
              )}
            </Pressable>
          )
        )}

        {/* Candidates Section */}
        <View style={styles.candidatesSection}>
          <View style={[styles.sectionHeader, { flexDirection: isRtl ? "row-reverse" : "row" }]}>
            <Users size={16} color={Colors.primary} />
            <Text style={styles.sectionTitle}>{t("voterElectionDetail.candidates")}</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{candidates.length}</Text>
            </View>
          </View>

          {candidates.length === 0 ? (
            <EmptyState
              title={t("voterElectionDetail.noCandidates")}
              description={t("common.noData")}
              icon={Users}
            />
          ) : (
            <View style={styles.candidatesGrid}>
              {candidates.map((cand) => (
                <View key={cand.id} style={styles.candidateCard}>
                  <CandidateAvatar
                    candidate={cand}
                    candidateId={cand.id}
                    style={styles.candidateAvatar}
                    size={72}
                  />
                  <Text style={styles.candidateName} numberOfLines={1}>
                    {cand.full_name}
                  </Text>
                  <Text style={styles.candidateParty} numberOfLines={1}>
                    {cand.party_name || t("voter.defaultName")}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
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
    marginTop: 64,
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
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  detailCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 20,
    padding: 16,
    marginTop: 48,
    gap: 12,
    ...Shadows.sm,
  },
  cardHeader: {
    justifyContent: "space-between",
    alignItems: "center",
  },
  votedBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  votedBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.success,
  },
  electionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: Colors.onSurface,
    lineHeight: 26,
  },
  electionDesc: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    lineHeight: 20,
    opacity: 0.85,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  datesRow: {
    flexDirection: "row",
    gap: 8,
  },
  dateItem: {
    flex: 1,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    gap: 6,
  },
  dateLabel: {
    fontSize: 9,
    color: Colors.muted,
    fontWeight: "600",
  },
  dateValue: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.onSurface,
    textAlign: "center",
  },
  actionBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    gap: 12,
    ...Shadows.sm,
  },
  actionBannerPrimary: {
    backgroundColor: Colors.primary,
  },
  actionBannerSuccess: {
    backgroundColor: Colors.successLight,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  actionBannerInfo: {
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.info,
  },
  actionBannerWarning: {
    backgroundColor: Colors.warningLight,
    borderWidth: 1,
    borderColor: "#FCD34D",
  },
  actionBannerTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
  },
  actionBannerSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
    fontWeight: "600",
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  candidatesSection: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 20,
    padding: 16,
    gap: 14,
    ...Shadows.sm,
  },
  sectionHeader: {
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.onSurface,
  },
  countBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.primary,
  },
  candidatesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  candidateCard: {
    width: "48%",
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  candidateAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.surfaceContainer,
  },
  candidateName: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.onSurface,
    textAlign: "center",
  },
  candidateParty: {
    fontSize: 10,
    color: Colors.muted,
    textAlign: "center",
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
});

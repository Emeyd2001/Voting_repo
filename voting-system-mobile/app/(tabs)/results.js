import React, { useState, useMemo, useEffect } from "react";
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  SafeAreaView, Image, ActivityIndicator, Alert,
} from "react-native";
import { useTranslation } from "react-i18next";
import { BarChart3, Award, CheckCircle2, ChevronDown, Calendar, AlertCircle, User, LogOut } from "lucide-react-native";
import { useAuthStore } from "../../src/store/authStore";

import { useElections, useResults, useElectionCandidates } from "../../src/hooks/useResource";
import { LoadingState } from "../../src/components/ui/LoadingState";
import { ErrorState } from "../../src/components/ui/ErrorState";
import { EmptyState } from "../../src/components/ui/EmptyState";
import CandidateAvatar from "../../src/components/CandidateAvatar.js";
import { getImageUrl, candidateImageSource } from "../../src/lib/utils";
import { formatNumber, formatDate } from "../../src/lib/status";
import { Colors, Shadows } from "../../src/theme/colors";
import i18n from "../../src/i18n";

export default function ResultsScreen() {
  const { t } = useTranslation();
  const isRtl = i18n.language === "ar";

  const electionsQ = useElections();
  const elections = useMemo(() => electionsQ.data ?? [], [electionsQ.data]);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  // Only show results for elections that are closed, archived or active
  const votableElections = useMemo(() => {
    return elections.filter((e) => e.status === "closed" || e.status === "archived" || e.status === "active");
  }, [elections]);

  const [selectedElectionId, setSelectedElectionId] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Set default selection
  useEffect(() => {
    if (votableElections.length > 0 && !selectedElectionId) {
      // Prefer closed/archived first, else active
      const completed = votableElections.find((e) => e.status === "closed" || e.status === "archived");
      setSelectedElectionId(completed ? completed.id : votableElections[0].id);
    }
  }, [votableElections, selectedElectionId]);

  const selectedElection = useMemo(() => {
    return elections.find((e) => e.id === selectedElectionId);
  }, [elections, selectedElectionId]);

  const resultsQ = useResults(selectedElectionId);

  // Fetch candidate details for the selected election to resolve images when results only include IDs
  const electionCandidatesQ = useElectionCandidates(selectedElectionId);
  const electionCandidates = useMemo(() => electionCandidatesQ.data ?? [], [electionCandidatesQ.data]);

  // Parse results safely
  const resultsData = useMemo(() => {
    const raw = resultsQ.data;
    if (!raw) return { totalVotes: 0, candidates: [] };
    // Raw may be an array or an object with { total_votes, results }
    let items = [];
    if (Array.isArray(raw)) {
      items = raw;
    } else if (raw.results && Array.isArray(raw.results)) {
      items = raw.results;
    } else {
      return { totalVotes: 0, candidates: [] };
    }

    // Normalize items to have `candidate` (object when available) and `vote_count`
    const candidates = items.map((it) => {
      const candidateId = it.candidate_id ?? (it.candidate && (typeof it.candidate === "object" ? it.candidate.id : it.candidate));
      const candidateObj = electionCandidates.find((c) => String(c.id) === String(candidateId)) ?? null;
      return {
        ...it,
        candidate: candidateObj || (it.candidate && typeof it.candidate === "object" ? it.candidate : null),
        vote_count: it.vote_count ?? it.count ?? 0,
        // keep percentage as-is
      };
    });

    const totalVotes = (raw.total_votes ?? null) ?? candidates.reduce((acc, curr) => acc + (curr.vote_count ?? 0), 0);
    return { totalVotes, candidates };
  }, [resultsQ.data, electionCandidates]);

  // Sort candidates by vote count descending
  const sortedCandidates = useMemo(() => {
    return [...resultsData.candidates].sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0));
  }, [resultsData.candidates]);

  // Determine winner if election is closed/archived
  const winner = useMemo(() => {
    if (sortedCandidates.length === 0) return null;
    if (selectedElection?.status !== "closed" && selectedElection?.status !== "archived") return null;
    return sortedCandidates[0];
  }, [sortedCandidates, selectedElection]);

  

  if (electionsQ.loading) return <LoadingState />;
  if (electionsQ.error) {
    return <ErrorState error={electionsQ.error} onRetry={electionsQ.refetch} />;
  }

  if (votableElections.length === 0) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { textAlign: isRtl ? "right" : "left" }]}>
            {t("voterResults.title")}
          </Text>
        </View>
        <EmptyState
          title={t("voterResults.noResults")}
          description={t("voter.noActiveDesc")}
          icon={BarChart3}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { textAlign: isRtl ? "right" : "left" }]}> 
            {t("voterResults.title")}
          </Text>
          <Text style={[styles.headerSubtitle, { textAlign: isRtl ? "right" : "left" }]}> 
            {t("voterResults.subtitle")}
          </Text>
        </View>
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

      {/* Custom Picker / Dropdown */}
      <View style={styles.pickerContainer}>
        <Pressable
          style={[styles.pickerButton, { flexDirection: isRtl ? "row-reverse" : "row" }]}
          onPress={() => setShowDropdown(!showDropdown)}
        >
          <BarChart3 size={18} color={Colors.primary} />
          <Text style={[styles.pickerButtonText, { textAlign: isRtl ? "right" : "left" }]} numberOfLines={1}>
            {selectedElection ? (selectedElection.title === "الإنتخابات الرئاسية 2026" ? t("election.presidential2026") : selectedElection.title) : t("voterResults.chooseElection")}
          </Text>
          <ChevronDown size={18} color={Colors.secondary} />
        </Pressable>

        {showDropdown && (
          <View style={styles.dropdownList}>
            <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
              {votableElections.map((el) => {
                const isSelected = el.id === selectedElectionId;
                return (
                  <Pressable
                    key={el.id}
                    style={[
                      styles.dropdownItem,
                      isSelected && styles.dropdownItemActive,
                      { flexDirection: isRtl ? "row-reverse" : "row" }
                    ]}
                    onPress={() => {
                      setSelectedElectionId(el.id);
                      setShowDropdown(false);
                    }}
                  >
                    <Text style={[
                      styles.dropdownItemText,
                      isSelected && styles.dropdownItemTextActive,
                      { textAlign: isRtl ? "right" : "left" }
                    ]}>
                      {el.title}
                    </Text>
                    {isSelected && <CheckCircle2 size={16} color={Colors.primary} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Main Results View */}
      {resultsQ.loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>{t("common.loading")}</Text>
        </View>
      ) : resultsQ.error ? (
        <View style={styles.errorContainer}>
          <AlertCircle size={32} color={Colors.error} />
          <Text style={styles.errorText}>{t("voterResults.noResultsForElection")}</Text>
          <Pressable style={styles.retryButton} onPress={resultsQ.refetch}>
            <Text style={styles.retryButtonText}>{t("common.retry")}</Text>
          </Pressable>
        </View>
      ) : sortedCandidates.length === 0 ? (
        <EmptyState
          title={t("voterResults.noResultsForElection")}
          description={t("voter.noActiveDesc")}
          icon={BarChart3}
        />
      ) : (
        <ScrollView
          style={styles.resultsScroll}
          contentContainerStyle={styles.resultsContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Winner Card */}
          {winner && (
            <View style={styles.winnerCard}>
              <View style={[styles.winnerBadge, { flexDirection: isRtl ? "row-reverse" : "row" }]}>
                <Award size={18} color="#fff" />
                <Text style={styles.winnerBadgeText}>{t("voterResults.winner")}</Text>
              </View>

              <View style={[styles.winnerRow, { flexDirection: isRtl ? "row-reverse" : "row" }]}>
                <CandidateAvatar
                  candidate={winner.candidate}
                  candidateId={winner.candidate?.id}
                  style={styles.winnerAvatar}
                  size={84}
                />
                <View style={[styles.winnerInfo, { alignItems: isRtl ? "flex-end" : "flex-start" }]}>
                  <Text style={styles.winnerName}>{winner.candidate?.full_name || winner.candidate_name || winner.name}</Text>
                  <Text style={styles.winnerParty}>{winner.candidate?.party_name || winner.party_name || t("voter.defaultName")}</Text>
                </View>
              </View>

              <View style={styles.winnerStats}>
                <View style={styles.winnerStatItem}>
                  <Text style={styles.winnerStatValue}>
                    {formatNumber(winner.vote_count)}
                  </Text>
                  <Text style={styles.winnerStatLabel}>{t("voterResults.fromVotes")}</Text>
                </View>
                <View style={styles.winnerStatDivider} />
                <View style={styles.winnerStatItem}>
                  <Text style={[styles.winnerStatValue, { color: Colors.primary }]}>
                    {formatNumber((winner.percentage ?? 0).toFixed(1))}%
                  </Text>
                  <Text style={styles.winnerStatLabel}>{t("voterProfile.participationRate")}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Info Banner */}
          <View style={[styles.infoBanner, { flexDirection: isRtl ? "row-reverse" : "row" }]}>
            <Award size={16} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoBannerText, { textAlign: isRtl ? "right" : "left" }]}>
                {t("voterResults.certifiedNotice")}
              </Text>
              <Text style={[styles.infoBannerSub, { textAlign: isRtl ? "right" : "left" }]}>
                {t("voterProfile.fullName")}: {formatNumber(resultsData.totalVotes)} {t("voterResults.fromVotes")}
              </Text>
            </View>
          </View>

          {/* Candidate Standings */}
          <Text style={[styles.sectionTitle, { textAlign: isRtl ? "right" : "left" }]}>
            {t("voterResults.ranking")}
          </Text>

          {sortedCandidates.map((item, index) => {
            const pct = item.percentage ?? 0;
            return (
              <View key={item.candidate?.id ?? index} style={styles.candidateCard}>
                <View style={[styles.candidateInfoRow, { flexDirection: isRtl ? "row-reverse" : "row" }]}>
                  <View style={styles.avatarWrap}>
                    <CandidateAvatar
                      candidate={item.candidate}
                      candidateId={item.candidate?.id}
                      style={styles.candidateAvatar}
                      size={56}
                    />
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankBadgeText}>{formatNumber(index + 1)}</Text>
                    </View>
                  </View>

                  <View style={[styles.candTextWrap, { alignItems: isRtl ? "flex-end" : "flex-start" }]}>
                    <Text style={styles.candidateName}>{item.candidate?.full_name || item.candidate_name || item.name}</Text>
                    <Text style={styles.candidateParty}>{item.candidate?.party_name || item.party_name}</Text>
                  </View>

                  <View style={[styles.candVotesWrap, { alignItems: isRtl ? "flex-end" : "flex-start" }]}>
                    <Text style={styles.votePercentage}>{formatNumber(pct.toFixed(1))}%</Text>
                    <Text style={styles.voteCount}>{formatNumber(item.vote_count)} {t("voterResults.fromVotes")}</Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.max(2, Math.min(100, pct))}%`,
                        alignSelf: isRtl ? "flex-end" : "flex-start",
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    marginTop: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: Colors.onSurface,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.secondary,
    marginTop: 4,
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
  pickerContainer: {
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    position: "relative",
    zIndex: 100,
  },
  pickerButton: {
    height: 50,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 10,
    ...Shadows.sm,
  },
  pickerButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  dropdownList: {
    position: "absolute",
    top: 54,
    left: 20,
    right: 20,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
    overflow: "hidden",
    zIndex: 200,
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainer,
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownItemActive: {
    backgroundColor: Colors.primaryLight,
  },
  dropdownItemText: {
    flex: 1,
    fontSize: 13,
    color: Colors.onSurface,
    fontWeight: "500",
  },
  dropdownItemTextActive: {
    color: Colors.primary,
    fontWeight: "700",
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.secondary,
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: Colors.secondary,
    textAlign: "center",
    fontWeight: "600",
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  resultsScroll: {
    flex: 1,
  },
  resultsContent: {
    padding: 16,
    gap: 8,
    paddingBottom: 64,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  winnerCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 20,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.accent,
    ...Shadows.md,
  },
  winnerBadge: {
    backgroundColor: Colors.accent,
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
    alignItems: "center",
    gap: 6,
  },
  winnerBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#fff",
  },
  winnerRow: {
    alignItems: "center",
    gap: 16,
  },
  winnerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfaceContainer,
  },
  winnerInfo: {
    flex: 1,
    gap: 4,
  },
  winnerName: {
    fontSize: 16,
    fontWeight: "900",
    color: Colors.onSurface,
  },
  winnerParty: {
    fontSize: 12,
    color: Colors.secondary,
    fontWeight: "600",
  },
  winnerStats: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
  },
  winnerStatItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  winnerStatValue: {
    fontSize: 16,
    fontWeight: "900",
    color: Colors.onSurface,
  },
  winnerStatLabel: {
    fontSize: 10,
    color: Colors.secondary,
    fontWeight: "600",
  },
  winnerStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
  },
  infoBanner: {
    backgroundColor: Colors.primaryLight,
    padding: 14,
    borderRadius: 16,
    alignItems: "center",
    gap: 10,
  },
  infoBannerText: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.primary,
  },
  infoBannerSub: {
    fontSize: 10,
    color: Colors.primary,
    opacity: 0.8,
    marginTop: 2,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.onSurface,
    marginBottom: -4,
  },
  candidateCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    padding: 10,
    gap: 12,
    ...Shadows.sm,
  },
  candidateInfoRow: {
    alignItems: "center",
    gap: 12,
  },
  avatarWrap: {
    position: "relative",
  },
  candidateAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceContainer,
  },
  rankBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: Colors.secondary,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  rankBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#fff",
  },
  candTextWrap: {
    flex: 1,
    gap: 2,
  },
  candidateName: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.onSurface,
  },
  candidateParty: {
    fontSize: 11,
    color: Colors.muted,
    fontWeight: "500",
  },
  candVotesWrap: {
    gap: 2,
  },
  votePercentage: {
    fontSize: 14,
    fontWeight: "900",
    color: Colors.primary,
  },
  voteCount: {
    fontSize: 10,
    color: Colors.muted,
    fontWeight: "600",
  },
  progressBarBg: {
    height: 8,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 99,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 99,
  },
});

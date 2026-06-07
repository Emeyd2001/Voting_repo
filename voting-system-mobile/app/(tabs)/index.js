import React, { useMemo } from "react";
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  SafeAreaView, Image,
} from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  Vote, Calendar, ShieldCheck, CheckCircle2,
  Clock, Sparkles, BarChart3, ChevronLeft, Users,
} from "lucide-react-native";

import { useAuthStore } from "../../src/store/authStore";
import { useElections, useMyVotes } from "../../src/hooks/useResource";
import { LoadingState } from "../../src/components/ui/LoadingState";
import { ErrorState } from "../../src/components/ui/ErrorState";
import { formatDate, labelStatus } from "../../src/lib/status";
import { Colors, Shadows } from "../../src/theme/colors";

export default function HomeScreen() {
  const BallotBox = (() => {
    try {
      return require('../../assets/ballot_box.png');
    } catch (e) {
      return null;
    }
  })();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const electionsQ = useElections();
  const myVotesQ = useMyVotes();

  const elections = useMemo(() => electionsQ.data ?? [], [electionsQ.data]);
  const myVotes = useMemo(() => myVotesQ.data ?? [], [myVotesQ.data]);

  const { active, upcoming, past } = useMemo(() => ({
    active: elections.find((e) => e.status === "active"),
    upcoming: elections.filter((e) => e.status === "scheduled"),
    past: elections.filter((e) => e.status === "closed" || e.status === "archived"),
  }), [elections]);

  const activeCount = useMemo(() => elections.filter((e) => e.status === "active").length, [elections]);

  const votedIds = useMemo(() => new Set(myVotes.map((v) => v.election)), [myVotes]);
  const hasVotedActive = active ? votedIds.has(active.id) : false;

  if (electionsQ.loading) return <LoadingState />;
  if (electionsQ.error) return <ErrorState error={electionsQ.error} onRetry={electionsQ.refetch} />;

  const firstName = user?.full_name?.split(" ")[0] ?? t("voter.defaultName");

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Banner */}
        <View style={styles.bannerWrap}>
          <View style={styles.bannerInner}>
            <View style={styles.bannerTag}>
              <Sparkles size={14} color="#fff" />
              <Text style={styles.bannerTagText}>{t("voter.secureIdentity")}</Text>
            </View>
            <Text style={styles.bannerTitle}>
              {t("voter.welcome")} <Text style={{ color: "#FFD166" }}>{firstName}</Text>
            </Text>
            <Text style={styles.bannerDesc}>{t("voter.platformDesc")}</Text>
            <View style={styles.bannerGraphic} pointerEvents="none">
              {BallotBox ? (
                <Image source={BallotBox} style={{ width: 120, height: 120, resizeMode: 'contain', opacity: 0.95 }} />
              ) : (
                <Vote size={80} color="rgba(255,255,255,0.12)" />
              )}
            </View>
          </View>
        </View>

        {/* Already Voted Badge */}
        {hasVotedActive && (
          <View style={[styles.card, styles.votedCard]}>
            <View style={styles.iconWrap}>
              <CheckCircle2 size={24} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{t("voter.votedThanks")}</Text>
              <Text style={styles.cardSub}>{t("voter.votedConfirmed")}</Text>
            </View>
          </View>
        )}

        {/* Active Election */}
        {active ? (
          <View style={[styles.card, styles.sectionSpacing]}>
            <View style={styles.row}>
              <View style={[styles.iconWrap, { backgroundColor: Colors.primaryLight }]}> 
                {BallotBox ? (
                  <Image source={BallotBox} style={{ width: 22, height: 22, resizeMode: 'contain' }} />
                ) : (
                  <Vote size={22} color={Colors.primary} />
                )}
                <View style={styles.pulseDot} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>{t("voter.activeElectionTitle")}</Text>
                </View>
                <Text style={styles.electionTitle} numberOfLines={2}>{active.title}</Text>
              </View>
            </View>

            <View style={styles.dateRow}>
              {[
                { label: t("voter.startLabel"), value: formatDate(active.start_date, true) },
                { label: t("voter.endLabel"), value: formatDate(active.end_date, true) },
              ].map(({ label, value }) => (
                <View key={label} style={styles.dateCard}>
                  <Calendar size={14} color={Colors.primary} />
                  <Text style={styles.dateLabel}>{label}</Text>
                  <Text style={styles.dateValue}>{value}</Text>
                </View>
              ))}
            </View>

            {!hasVotedActive ? (
                <Pressable
                style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
                onPress={() => router.push(`/election/${active.id}/vote`)}
              >
                {BallotBox ? (
                  <Image source={BallotBox} style={{ width: 18, height: 18, tintColor: '#fff', resizeMode: 'contain' }} />
                ) : (
                  <Vote size={18} color="#fff" />
                )}
                <Text style={styles.primaryBtnText}>{t("voter.voteNow")}</Text>
              </Pressable>
            ) : (
              <Pressable
                style={({ pressed }) => [styles.outlineBtn, pressed && styles.btnPressed]}
                onPress={() => router.push(`/election/${active.id}`)}
              >
                <ShieldCheck size={16} color={Colors.primary} />
                <Text style={styles.outlineBtnText}>{t("voter.followElection")}</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={[styles.card, styles.centerCard, styles.noActiveSpacing]}> 
            <View style={styles.iconCircle}>
              {BallotBox ? (
                <Image source={BallotBox} style={styles.iconCircleImg} />
              ) : (
                <Vote size={36} color="#fff" />
              )}
            </View>
            <Text style={styles.noActiveTitle}>{t("voter.noActiveElections")}</Text>
            <Text style={styles.noActiveSub}>{t("voter.noActiveDesc")}</Text>
          </View>
        )}

        {/* Compact Stats Row */}
        <View style={[styles.statsRowCompact, styles.sectionSpacing]}>
          <View style={styles.smallStat}>
            <Calendar size={18} color={Colors.primary} />
            <Text style={styles.smallStatValue}>{upcoming.length}</Text>
            <Text style={styles.smallStatLabel}>{t("home.upcoming", { defaultValue: "Élections à venir" })}</Text>
          </View>
          <View style={styles.smallStat}>
            {BallotBox ? (
              <Image source={BallotBox} style={{ width: 18, height: 18, resizeMode: 'contain' }} />
            ) : (
              <Users size={18} color={Colors.info} />
            )}
            <Text style={styles.smallStatValue}>{past.length}</Text>
            <Text style={styles.smallStatLabel}>{t("home.past", { defaultValue: "Élection passée" })}</Text>
          </View>
          <View style={styles.smallStat}>
            <CheckCircle2 size={18} color={Colors.success} />
            <Text style={styles.smallStatValue}>{myVotes.length}</Text>
            <Text style={styles.smallStatLabel}>{t("home.myVotes", { defaultValue: "Mes votes" })}</Text>
          </View>
        </View>

        {/* Action Links */}
        <View style={[styles.linksList, styles.sectionSpacing]}>
          <Pressable style={styles.linkCard} onPress={() => router.push('/(tabs)/elections')}>
            <View style={[styles.linkIcon, { backgroundColor: '#E6F4EA' }]}>
              <Calendar size={20} color={Colors.primary} />
            </View>
            <Text style={styles.linkLabel}>{t("home.allElections", { defaultValue: "Toutes les élections" })}</Text>
            <ChevronLeft size={18} color={Colors.secondary} />
          </Pressable>

          <Pressable style={styles.linkCard} onPress={() => router.push('/(tabs)/results')}>
            <View style={[styles.linkIcon, { backgroundColor: '#FFF4E6' }]}>
              <BarChart3 size={20} color={'#E86A3A'} />
            </View>
            <Text style={styles.linkLabel}>{t("home.results", { defaultValue: "Résultats" })}</Text>
            <ChevronLeft size={18} color={Colors.secondary} />
          </Pressable>

          <Pressable style={styles.linkCard} onPress={() => router.push('/(tabs)/profile')}>
            <View style={[styles.linkIcon, { backgroundColor: '#EEF6FF' }]}>
              <ShieldCheck size={20} color={'#2B6CB0'} />
            </View>
            <Text style={styles.linkLabel}>{t("home.profile", { defaultValue: "Mon profil électoral" })}</Text>
            <ChevronLeft size={18} color={Colors.secondary} />
          </Pressable>
        </View>

        {/* Quick Links removed (duplicate of bottom tabs) */}

        {/* Timeline + Statuses placed in footer to anchor at bottom when space allows */}
        {/* History / Upcoming */}
        <View style={styles.sectionSpacing}>
          <Text style={styles.sectionTitle}>{t("home.history", { defaultValue: "Historique et à venir" })}
            <Text style={{ color: Colors.primary }}>{'  '}{t('home.seeAll', { defaultValue: 'Voir tout' })}</Text>
          </Text>
          {past[0] ? (
            <Pressable style={[styles.card, styles.historyCard]} onPress={() => router.push(`/election/${past[0].id}`)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <View style={[styles.historyIconCircle, { backgroundColor: '#E6F4EA' }] }>
                  {BallotBox ? (
                    <Image source={BallotBox} style={{ width: 28, height: 28, resizeMode: 'contain' }} />
                  ) : (
                    <Vote size={28} color={Colors.primary} />
                  )}
                </View>
                <View style={styles.historyLeft}>
                  <Text style={styles.historyTitle}>{past[0].title}</Text>
                  <Text style={styles.historyDate}>{formatDate(past[0].start_date)}</Text>
                </View>
              </View>
              <View style={styles.historyIconWrap}>
                <ChevronLeft size={18} color={Colors.secondary} />
              </View>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 8, paddingBottom: 64, flexGrow: 1, justifyContent: 'flex-end' },

  bannerWrap: { marginTop: 28, borderRadius: 20, overflow: 'hidden' },
  bannerInner: { backgroundColor: Colors.primary, padding: 28, paddingBottom: 36, paddingRight: 140, gap: 8, borderRadius: 20 },
  bannerTag: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  bannerTagText: { fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.95)" },
  bannerTitle: { fontSize: 24, fontWeight: "900", color: "#fff", lineHeight: 34 },
  bannerDesc: { fontSize: 13, color: "rgba(255,255,255,0.9)", lineHeight: 20, marginTop: 2 },

  card: { backgroundColor: Colors.surfaceCard, borderRadius: 20, padding: 16, gap: 12, ...Shadows.sm },
  votedCard: { flexDirection: "row", alignItems: "center", borderLeftWidth: 4, borderLeftColor: Colors.primary },
  centerCard: { alignItems: "center", paddingVertical: 18 },
  cardTitle: { fontSize: 15, fontWeight: "800", color: Colors.onSurface },
  cardSub: { fontSize: 12, color: Colors.muted },

  row: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  iconWrap: { width: 48, height: 48, borderRadius: 16, backgroundColor: Colors.primaryLight, alignItems: "center", justifyContent: "center", position: "relative" },
  pulseDot: { position: "absolute", top: -2, right: -2, width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary, borderWidth: 2, borderColor: Colors.surfaceCard },
  activeBadge: { backgroundColor: Colors.primaryLight, alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginBottom: 4 },
  activeBadgeText: { fontSize: 10, fontWeight: "800", color: Colors.primary },
  electionTitle: { fontSize: 16, fontWeight: "900", color: Colors.onSurface },

  dateRow: { flexDirection: "row", gap: 8 },
  dateCard: { flex: 1, backgroundColor: Colors.surfaceContainer, borderRadius: 12, padding: 10, alignItems: "center", gap: 4 },
  dateLabel: { fontSize: 10, color: Colors.muted },
  dateValue: { fontSize: 11, fontWeight: "700", color: Colors.onSurface, textAlign: "center" },

  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 50, borderRadius: 14, backgroundColor: Colors.primary, ...Shadows.lg },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  outlineBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 50, borderRadius: 14, borderWidth: 2, borderColor: Colors.primaryLight, backgroundColor: Colors.primaryLight },
  outlineBtnText: { color: Colors.primary, fontSize: 14, fontWeight: "700" },
  btnPressed: { opacity: 0.8, transform: [{ scale: 0.97 }] },

  noActiveTitle: { fontSize: 15, fontWeight: "700", color: Colors.secondary },
  noActiveSub: { fontSize: 12, color: Colors.muted, textAlign: "center" },

  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, backgroundColor: Colors.surfaceCard, borderRadius: 16, padding: 14, alignItems: "center", gap: 4, ...Shadows.sm },
  statValue: { fontSize: 24, fontWeight: "900" },
  statLabel: { fontSize: 10, color: Colors.secondary, fontWeight: "600", textAlign: "center" },

  /* Compact stats used under banner */
  statsRowCompact: { flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  smallStat: { flex: 1, backgroundColor: Colors.surfaceCard, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 10, alignItems: 'center', gap: 6, ...Shadows.sm },
  smallStatValue: { fontSize: 20, fontWeight: '900', color: Colors.onSurface },
  smallStatLabel: { fontSize: 12, color: Colors.secondary, textAlign: 'center' },

  linkCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: Colors.surfaceCard, borderRadius: 16, padding: 14, ...Shadows.sm },
  linkIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  linkLabel: { flex: 1, fontSize: 14, fontWeight: "700" },

  sectionTitle: { fontSize: 13, fontWeight: "800", color: Colors.onSurface, marginBottom: 4 },
  sectionSpacing: { marginTop: 12 },
  noActiveSpacing: { marginTop: 22 },

  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  timelineItem: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, padding: 12 },
  timelineIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  timelineTitle: { fontSize: 13, fontWeight: "700", color: Colors.onSurface },
  timelineSub: { fontSize: 11, color: Colors.muted },
  upcomingBadge: { backgroundColor: "#FDE68A", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  upcomingBadgeText: { fontSize: 10, fontWeight: "700", color: Colors.warning },

  // Reuse in locale link
  infoLight: Colors.infoLight,
  info: Colors.info,
  footer: { marginTop: 'auto' },

  linksList: { gap: 10 },
  historyCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  historyLeft: { flex: 1 },
  historyStatus: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, marginBottom: 8 },
  historyTitle: { fontSize: 15, fontWeight: '800', color: Colors.onSurface },
  historyDate: { fontSize: 12, color: Colors.muted, marginTop: 4 },
  historyIconWrap: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  historyIconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  bannerGraphic: { position: 'absolute', right: 18, top: 18, opacity: 0.9 },
  iconCircleImg: { width: 36, height: 36, tintColor: '#fff' },
});

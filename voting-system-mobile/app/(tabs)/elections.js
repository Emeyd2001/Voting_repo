import React, { useState, useMemo } from "react";
import {
  View, Text, TextInput, ScrollView, Pressable, StyleSheet,
  SafeAreaView, FlatList,
} from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Search, Vote, Calendar, ChevronLeft, ChevronRight, Inbox } from "lucide-react-native";

import { useElections, useMyVotes } from "../../src/hooks/useResource";
import { LoadingState } from "../../src/components/ui/LoadingState";
import { ErrorState } from "../../src/components/ui/ErrorState";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { StatusBadge } from "../../src/components/ui/StatusBadge";
import { formatDate } from "../../src/lib/status";
import { Colors, Shadows } from "../../src/theme/colors";
import i18n from "../../src/i18n";

export default function ElectionsScreen() {
  const { t } = useTranslation();
  const isRtl = i18n.language === "ar";
  
  const electionsQ = useElections();
  const myVotesQ = useMyVotes();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'active', 'scheduled', 'closed'

  const elections = useMemo(() => electionsQ.data ?? [], [electionsQ.data]);
  const myVotes = useMemo(() => myVotesQ.data ?? [], [myVotesQ.data]);
  const votedIds = useMemo(() => new Set(myVotes.map((v) => v.election)), [myVotes]);

  const filteredElections = useMemo(() => {
    return elections.filter((item) => {
      // Search text filter
      const matchesSearch = item.title?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status tab filter
      let matchesTab = true;
      if (activeTab === "active") {
        matchesTab = item.status === "active";
      } else if (activeTab === "scheduled") {
        matchesTab = item.status === "scheduled";
      } else if (activeTab === "closed") {
        matchesTab = item.status === "closed" || item.status === "archived";
      }
      
      return matchesSearch && matchesTab;
    });
  }, [elections, searchQuery, activeTab]);

  if (electionsQ.loading) return <LoadingState />;
  if (electionsQ.error) {
    return <ErrorState error={electionsQ.error} onRetry={electionsQ.refetch} />;
  }

  const tabs = [
    { id: "all", label: t("voterElections.tabAll") },
    { id: "active", label: t("voterElections.tabActive") },
    { id: "scheduled", label: t("voterElections.tabScheduled") },
    { id: "closed", label: t("voterElections.tabClosed") },
  ];

  const renderElectionCard = ({ item }) => {
    const hasVoted = votedIds.has(item.id);
    const isElectionActive = item.status === "active";

    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => router.push(`/election/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <StatusBadge status={item.status} t={t} />
          {hasVoted && (
            <View style={styles.votedBadge}>
              <Text style={styles.votedBadgeText}>{t("voterElections.voted")}</Text>
            </View>
          )}
        </View>

        <Text style={[styles.electionTitle, { textAlign: isRtl ? "right" : "left" }]}>
          {item.title}
        </Text>

        <View style={[styles.cardDivider, { alignSelf: isRtl ? "flex-end" : "flex-start" }]} />

        <View style={[styles.cardFooter, { flexDirection: isRtl ? "row-reverse" : "row" }]}>
          <View style={[styles.dateWrap, { flexDirection: isRtl ? "row-reverse" : "row" }]}>
            <Calendar size={14} color={Colors.muted} />
            <Text style={styles.dateText}>
              {formatDate(item.start_date)}
            </Text>
          </View>
          
          <View style={[styles.actionLink, { flexDirection: isRtl ? "row-reverse" : "row" }]}>
            <Text style={styles.actionText}>
              {isElectionActive && !hasVoted ? t("voter.voteNow") : t("voterElections.viewDetails")}
            </Text>
            {isRtl ? (
              <ChevronLeft size={16} color={Colors.primary} />
            ) : (
              <ChevronRight size={16} color={Colors.primary} />
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { textAlign: isRtl ? "right" : "left" }]}>
          {t("voterElections.title")}
        </Text>
        <Text style={[styles.headerSubtitle, { textAlign: isRtl ? "right" : "left" }]}>
          {t("voterElections.subtitle")}
        </Text>
      </View>

      {/* Search and Filters */}
      <View style={styles.controls}>
        <View style={[styles.searchBar, { flexDirection: isRtl ? "row-reverse" : "row" }]}>
          <Search size={18} color={Colors.muted} />
          <TextInput
            style={[styles.searchInput, { textAlign: isRtl ? "right" : "left" }]}
            placeholder={t("voterElections.searchPlaceholder")}
            placeholderTextColor={Colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Tab Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={[
            styles.tabsContent,
            { flexDirection: isRtl ? "row-reverse" : "row" }
          ]}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                style={[
                  styles.tabPill,
                  isActive && styles.tabPillActive,
                ]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* List */}
      <FlatList
        data={filteredElections}
        renderItem={renderElectionCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            title={t("voterElections.noMatch")}
            description={t("common.noData")}
            icon={Inbox}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    marginTop: 32,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: Colors.onSurface,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.secondary,
    marginTop: 4,
  },
  controls: {
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  searchBar: {
    height: 48,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.onSurface,
    height: "100%",
  },
  tabsScroll: {
    flexGrow: 0,
    marginHorizontal: -20,
  },
  tabsContent: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 4,
  },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  tabPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.onSurfaceVariant,
  },
  tabLabelActive: {
    color: "#fff",
  },
  listContent: {
    padding: 20,
    gap: 8,
    paddingBottom: 64,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    ...Shadows.sm,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  cardHeader: {
    flexDirection: "row",
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
    fontSize: 15,
    fontWeight: "800",
    color: Colors.onSurface,
    lineHeight: 22,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.border,
    width: "100%",
  },
  cardFooter: {
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateWrap: {
    alignItems: "center",
    gap: 6,
  },
  dateText: {
    fontSize: 11,
    color: Colors.muted,
    fontWeight: "500",
  },
  actionLink: {
    alignItems: "center",
    gap: 2,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
  },
});

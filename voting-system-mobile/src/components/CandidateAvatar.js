import React from "react";
import { View, Image, ActivityIndicator } from "react-native";
import { useCandidate } from "../hooks/useResource";
import { candidateImageSource, getImageUrl } from "../lib/utils";
import { Colors } from "../theme/colors";

// Props: candidate (object), candidateId, size (number), style
export default function CandidateAvatar({ candidate, candidateId, size = 64, style }) {
  const needsFetch = !candidate || (!candidate.image && !candidate.profile_image && !candidate.avatar && !candidate.image_url && !candidate.profile_image_url);
  const candidateQ = useCandidate(needsFetch ? candidateId : null);
  const remote = needsFetch ? (candidateQ.data ?? null) : null;
  const loading = candidateQ.loading;

  const src =
    candidateImageSource(candidate) ||
    (remote && candidateImageSource(remote)) ||
    (candidate && candidate.party_logo ? { uri: getImageUrl(candidate.party_logo) } : null) ||
    (remote && remote.party_logo ? { uri: getImageUrl(remote.party_logo) } : null) ||
    null;

  if (loading) {
    return (
      <View style={[{ width: size, height: size, alignItems: "center", justifyContent: "center" }, style]}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (src) {
    return <Image source={src} style={[{ width: size, height: size, borderRadius: size / 2, overflow: "hidden" }, style]} />;
  }

  return <Image source={require("../../assets/icon.png")} style={[{ width: size, height: size, borderRadius: size / 2 }, style]} />;
}

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../auth/AuthContext";
import { navigationRef } from "../../navigation/navigationRef";
import { syncProviderRegistrationFromApi, type ProviderApprovalStatus } from "../../services/providerWorkflow";
import { APP_LIME } from "../../theme/appColors";

const TRACTOR = require("../../../assets/market/tractor-rental.png");

export function HomeProviderBanners() {
  const { token } = useAuth();
  const [status, setStatus] = useState<ProviderApprovalStatus | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        const next = await syncProviderRegistrationFromApi(token).catch(() => "not_submitted" as const);
        if (!active) return;
        setStatus(next);
      })();
      return () => {
        active = false;
      };
    }, [token])
  );

  const openOnboarding = () => {
    if (navigationRef.isReady()) navigationRef.navigate("ProviderOnboarding");
  };

  const openDashboard = () => {
    if (navigationRef.isReady()) navigationRef.navigate("ProviderMain", { screen: "Overview" });
  };

  if (!status) return null;

  if (status === "rejected" || status === "not_submitted") {
    return (
      <Pressable onPress={openOnboarding} accessibilityRole="button" accessibilityLabel="Register as a provider">
        <LinearGradient colors={["#16321c", "#2f6a28"]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.promo}>
          <Image source={TRACTOR} style={styles.promoArt} resizeMode="contain" />
          <View style={styles.iconWell}>
            <MaterialCommunityIcons name="tractor" size={22} color={APP_LIME} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.title}>Become a Provider</Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              List your tractor, harvester & other equipment and earn
            </Text>
          </View>
          <View style={styles.registerPill}>
            <Text style={styles.registerText}>Register Now</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color="#1a1a1a" />
          </View>
        </LinearGradient>
      </Pressable>
    );
  }

  if (status === "pending") {
    return (
      <View style={styles.pending}>
        <View style={styles.pendingIcon}>
          <MaterialCommunityIcons name="file-document-outline" size={22} color="#f0c36a" />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>Provider Registration</Text>
          <Text style={styles.pendingSub}>Your application is under review. We'll notify you once it's approved.</Text>
        </View>
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingText}>Pending</Text>
        </View>
      </View>
    );
  }

  return (
    <Pressable style={styles.dashboard} onPress={openDashboard} accessibilityRole="button" accessibilityLabel="Open provider dashboard">
      <View style={styles.iconWell}>
        <MaterialCommunityIcons name="tractor" size={22} color={APP_LIME} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>Provider Dashboard</Text>
        <Text style={styles.subtitle}>Manage your equipment, bookings and earnings</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={26} color={APP_LIME} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  promo: {
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 8,
    minHeight: 86,
    borderRadius: 16,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10
  },
  promoArt: {
    position: "absolute",
    right: -8,
    bottom: -6,
    width: 130,
    height: 86,
    opacity: 0.55
  },
  pending: {
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: "#3a3118",
    borderWidth: 1,
    borderColor: "rgba(240, 195, 106, 0.35)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10
  },
  pendingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#4a3d1c",
    alignItems: "center",
    justifyContent: "center"
  },
  pendingSub: {
    marginTop: 2,
    color: "#f0e2b8",
    fontSize: 12,
    lineHeight: 16
  },
  pendingBadge: {
    borderWidth: 1,
    borderColor: "#d08a3a",
    backgroundColor: "rgba(208, 138, 58, 0.15)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  pendingText: {
    color: "#f0a04a",
    fontSize: 12,
    fontWeight: "700"
  },
  dashboard: {
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: "#17341d",
    borderWidth: 1,
    borderColor: "rgba(201, 255, 53, 0.28)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10
  },
  iconWell: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#21461f",
    alignItems: "center",
    justifyContent: "center"
  },
  copy: {
    flex: 1,
    minWidth: 0
  },
  title: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800"
  },
  subtitle: {
    marginTop: 2,
    color: "#d7e4cc",
    fontSize: 12
  },
  registerPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: APP_LIME,
    borderRadius: 999,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 8
  },
  registerText: {
    color: "#1a1a1a",
    fontSize: 12,
    fontWeight: "800"
  }
});

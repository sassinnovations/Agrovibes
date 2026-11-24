import React, { useCallback } from "react";
import { Alert, StyleSheet } from "react-native";
import { useAuth } from "../../auth/AuthContext";
import { navigationRef } from "../../navigation/navigationRef";
import { syncProviderRegistrationFromApi } from "../../services/providerWorkflow";
import { MarketAdsCarousel } from "../market/MarketAdsCarousel";
import type { MarketAd } from "../market/marketAdsConfig";

const PROVIDER_HOME_ADS: MarketAd[] = [
  {
    id: "become-provider",
    variant: "light",
    badge: "EARN",
    title: "Become a",
    titleAccent: "Provider",
    subtitle: "Rent it. Service it. Earn.",
    cta: "Join As Provider"
  },
  {
    id: "provider-dashboard",
    variant: "dark",
    badge: "PROVIDER",
    title: "Provider",
    titleAccent: "Dashboard",
    subtitle: "Open listings after admin approval.",
    cta: "Open dashboard"
  }
];

export function HomeProviderBanners() {
  const { token } = useAuth();

  const onAdPress = useCallback(
    (ad: MarketAd) => {
      if (!navigationRef.isReady()) return;
      if (ad.id === "become-provider") {
        navigationRef.navigate("ProviderOnboarding");
        return;
      }
      if (ad.id !== "provider-dashboard") return;
      void (async () => {
        const status = await syncProviderRegistrationFromApi(token).catch(() => "not_submitted" as const);
        if (!navigationRef.isReady()) return;
        if (status === "approved") {
          navigationRef.navigate("ProviderMain");
          return;
        }
        if (status === "rejected") {
          navigationRef.navigate("ProviderOnboarding");
          return;
        }
        Alert.alert(
          status === "pending" ? "Waiting for admin" : "Provider registration",
          status === "pending"
            ? "Your application is with admin. Stay on the CropVibe feed until you get an approval or rejection notification."
            : "Finish Join as Provider first. After you submit, admin reviews it before listings open."
        );
        if (status !== "pending") navigationRef.navigate("ProviderOnboarding");
      })();
    },
    [token]
  );

  return <MarketAdsCarousel ads={PROVIDER_HOME_ADS} onAdPress={onAdPress} sectionStyle={styles.section} />;
}

const styles = StyleSheet.create({
  section: {
    marginTop: 8,
    marginBottom: 6
  }
});

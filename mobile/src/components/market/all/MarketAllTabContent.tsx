import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { MarketAdsCarousel } from "../MarketAdsCarousel";
import type { MarketAd } from "../marketAdsConfig";
import { MarketProductRail } from "../shared/MarketProductRail";
import { MarketServiceCard } from "../shared/MarketServiceCard";
import { fetchMarketplaceListings } from "../../../services/api";
import { MARKET_SERVICE_CARDS, type ProductRailItem } from "./marketAllConfig";
import { FeaturesWeekSection } from "./sections/FeaturesWeekSection";
import { MarketHeroSection } from "./sections/MarketHeroSection";
import { OffersCuratedSection } from "./sections/OffersCuratedSection";
import { WelcomeKisanBanner } from "./sections/WelcomeKisanBanner";

type MarketAllTabContentProps = {
  /** Category tile taps — opens listing shell for that category id. */
  onNavigate: (categoryId: string) => void;
  /** Hero, banners, search-style navigation without a category. */
  onBrowse: () => void;
};

function handleAdPress(ad: MarketAd, onNavigate: (id: string) => void, onBrowse: () => void) {
  const target = ad.target ?? { type: "browse" as const };
  if (target.type === "category") {
    onNavigate(target.categoryId);
    return;
  }
  onBrowse();
}

export function MarketAllTabContent({ onNavigate, onBrowse }: MarketAllTabContentProps) {
  const [products, setProducts] = useState<ProductRailItem[]>([]);

  useEffect(() => {
    let active = true;
    void fetchMarketplaceListings()
      .then((data) => {
        if (!active) return;
        setProducts(
          (data.listings || []).map((row) => ({
            id: String(row.id),
            title: row.cropName,
            tag: row.district || "Approved",
            price: Number(row.pricePerKg) || 0,
            mrp: Number(row.pricePerKg) || 0,
            discountPct: 0
          }))
        );
      })
      .catch(() => {
        if (active) setProducts([]);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <View style={styles.root}>
      <MarketHeroSection onPress={onBrowse} />

      <FeaturesWeekSection onPress={onBrowse} onCategoryPress={onNavigate} />

      <OffersCuratedSection onPress={onBrowse} />

      <MarketAdsCarousel
        onAdPress={(ad) => handleAdPress(ad, onNavigate, onBrowse)}
        sectionStyle={styles.inlineAds}
      />

      {products.length > 0 ? (
        <MarketProductRail
          title="Approved"
          titleAccent="listings"
          subtitle="Listings an admin has approved"
          products={products}
          onPress={() => onBrowse()}
        />
      ) : null}

      <WelcomeKisanBanner onPress={onBrowse} />

      {MARKET_SERVICE_CARDS.map((card) => (
        <MarketServiceCard key={card.id} card={card} onPress={onNavigate} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingBottom: 28
  },
  inlineAds: {
    marginTop: 8,
    marginBottom: 4
  }
});

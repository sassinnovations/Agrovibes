import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useMemo, useState } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { LocationMapPicker } from "../../components/LocationMapPicker";
import { useNotificationPanel } from "../../context/NotificationPanelContext";
import { navigateToRentalCart, navigateToRentalCategory, navigationRef } from "../../navigation/navigationRef";
import { useAndroidTabBackToHome } from "../../navigation/useAndroidScreenBack";
import { useAuth } from "../../auth/AuthContext";
import { APP_LIME, APP_TEXT, APP_TEXT_MUTED, APP_TEXT_ON_LIME } from "../../theme/appColors";
import { useTopChromeInset } from "../../theme/topChromeInset";
import { uploadCustomerBookings } from "./customerRentalBookings";
import { getRentalCart, type RentalCartLine } from "./rentalCart";

const LOGO = require("../../../assets/crop vibe.png");
const HERO_TRACTOR = require("../../../assets/rentals/hero-tractor.png");
const RED_TRACTOR = require("../../../assets/rentals/red-tractor.png");
const HARVESTER = require("../../../assets/rentals/harvester.png");
const IMPLEMENT = require("../../../assets/rentals/implement.png");
const DRONE = require("../../../assets/rentals/drone.png");

const SHORTCUTS = [
  { id: "machinery", label: "Equipment\nRentals", icon: "tractor" as const },
  { id: "land", label: "Land\nRentals", icon: "sprout" as const },
  { id: "labour", label: "Farm\nServices", icon: "account-hard-hat" as const },
  { id: "drone", label: "Drone\nServices", icon: "quadcopter" as const }
];

const EXPLORE = [
  { id: "machinery", title: "Tractors", image: RED_TRACTOR },
  { id: "machinery-harvesters", categoryId: "machinery", title: "Harvesters", image: HARVESTER },
  { id: "machinery-implements", categoryId: "machinery", title: "Implements", image: IMPLEMENT },
  { id: "drone", title: "Drones", image: DRONE }
];

export function RentalBookingsPortalScreen() {
  useAndroidTabBackToHome();
  const { token } = useAuth();
  const { openNotificationSheet } = useNotificationPanel();
  const topInset = useTopChromeInset();
  const [location, setLocation] = useState("Add location");
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [locationOpen, setLocationOpen] = useState(false);
  const [mapMode, setMapMode] = useState<"current" | "manual" | null>(null);
  const [cart, setCart] = useState<RentalCartLine[]>([]);
  const [query, setQuery] = useState("");

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void uploadCustomerBookings(token).catch(() => undefined);
      void getRentalCart().then((lines) => {
        if (active) setCart(lines);
      });
      return () => {
        active = false;
      };
    }, [token])
  );

  const near = { lat: locationLat, lng: locationLng };
  const openCategory = (categoryId: string) => navigateToRentalCategory(categoryId, location, near);
  const cards = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return EXPLORE;
    return EXPLORE.filter((item) => item.title.toLowerCase().includes(needle));
  }, [query]);
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.body, { paddingTop: topInset + 8 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          <View style={styles.headerActions}>
            <Pressable style={styles.iconBtn} onPress={() => navigateToRentalCart(location)} accessibilityLabel="Cart">
              <Ionicons name="cart-outline" size={22} color={APP_TEXT} />
              {cartCount > 0 ? (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount}</Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={openNotificationSheet} accessibilityLabel="Notifications">
              <Ionicons name="notifications-outline" size={22} color={APP_LIME} />
            </Pressable>
          </View>
        </View>

        <View style={styles.titleRow}>
          <View style={styles.titleCopy}>
            <Text style={styles.pageTitle}>Rentals</Text>
            <Text style={styles.pageSub}>Rent farm equipment, land and services near you</Text>
          </View>
          <Pressable
            style={styles.providerBtn}
            onPress={() => {
              if (navigationRef.isReady()) navigationRef.navigate("ProviderOnboarding");
            }}
            accessibilityRole="button"
            accessibilityLabel="Become a provider"
          >
            <MaterialCommunityIcons name="tractor" size={16} color={APP_LIME} />
            <Text style={styles.providerBtnText}>Become a Provider</Text>
          </Pressable>
        </View>

        <Pressable style={styles.locationBtn} onPress={() => setLocationOpen(true)} accessibilityRole="button" accessibilityLabel={`Location ${location}`}>
          <Ionicons name="location-sharp" size={16} color={APP_LIME} />
          <View>
            <Text style={styles.locationKicker}>Your location</Text>
            <Text style={styles.locationValue} numberOfLines={1}>
              {location}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={16} color={APP_TEXT_MUTED} />
        </Pressable>

        <Pressable style={styles.hero} onPress={() => openCategory("machinery")}>
          <Image source={HERO_TRACTOR} style={styles.heroImage} resizeMode="cover" />
          <LinearGradient colors={["rgba(0,0,0,0.72)", "rgba(0,0,0,0.15)", "rgba(0,0,0,0.05)"]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.heroShade} />
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>
              Need Farm{"\n"}
              <Text style={styles.heroTitleAccent}>Equipment?</Text>
            </Text>
            <Text style={styles.heroSub}>Rent tractors, harvesters, tools and more from trusted providers near you.</Text>
            <View style={styles.heroBtn}>
              <Text style={styles.heroBtnText}>Explore Rentals</Text>
              <Ionicons name="arrow-forward" size={14} color={APP_TEXT_ON_LIME} />
            </View>
          </View>
        </Pressable>

        <View style={styles.shortcuts}>
          {SHORTCUTS.map((item, index) => (
            <Pressable
              key={item.id}
              style={[styles.shortcut, index === 0 ? styles.shortcutOn : null]}
              onPress={() => openCategory(item.id)}
              accessibilityRole="button"
              accessibilityLabel={item.label.replace("\n", " ")}
            >
              <MaterialCommunityIcons name={item.icon} size={22} color={APP_LIME} />
              <Text style={styles.shortcutText}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.searchRow}>
          <View style={styles.search}>
            <Ionicons name="search" size={18} color="#8d8d8d" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search tractors, harvesters, sprayers, land..."
              placeholderTextColor="#8d8d8d"
              style={styles.searchInput}
              returnKeyType="search"
            />
          </View>
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Explore Categories</Text>
          <Pressable onPress={() => openCategory("all")} hitSlop={8}>
            <Text style={styles.viewAll}>View All →</Text>
          </Pressable>
        </View>

        {cards.length === 0 ? <Text style={styles.empty}>No rentals match that search.</Text> : null}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardRow}>
          {cards.map((item) => (
            <Pressable
              key={item.id}
              style={styles.photoCard}
              onPress={() => openCategory("categoryId" in item ? item.categoryId : item.id)}
              accessibilityRole="button"
              accessibilityLabel={item.title}
            >
              <Image source={item.image} style={styles.photo} resizeMode="cover" />
              <LinearGradient colors={["transparent", "rgba(0,0,0,0.78)"]} style={styles.photoShade} />
              <Text style={styles.photoTitle}>{item.title}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.confidence}>
          <View style={styles.confidenceHead}>
            <Ionicons name="calendar-outline" size={18} color={APP_LIME} />
            <Text style={styles.confidenceTitle}>Book with Confidence</Text>
          </View>
          <View style={styles.confidenceRow}>
            <Text style={styles.confidenceItem}>Verified Providers</Text>
            <Text style={styles.confidenceItem}>Real-time Availability</Text>
            <Text style={styles.confidenceItem}>In-app Support</Text>
          </View>
        </View>
      </ScrollView>

      <Modal visible={locationOpen} transparent animationType="fade" onRequestClose={() => setLocationOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setLocationOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <Text style={styles.sheetTitle}>Where do you need it?</Text>
            <Pressable
              style={styles.sheetRow}
              onPress={() => {
                setLocationOpen(false);
                setMapMode("current");
              }}
            >
              <Ionicons name="navigate" size={18} color={APP_LIME} />
              <Text style={styles.sheetLabel}>Use current location</Text>
            </Pressable>
            <Pressable
              style={styles.sheetRow}
              onPress={() => {
                setLocationOpen(false);
                setMapMode("manual");
              }}
            >
              <Ionicons name="map-outline" size={18} color={APP_LIME} />
              <Text style={styles.sheetLabel}>Add manually on the map</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
      <LocationMapPicker
        open={mapMode !== null}
        mode={mapMode || "auto"}
        label={location === "Add location" ? "" : location}
        lat={locationLat}
        lng={locationLng}
        onClose={() => setMapMode(null)}
        onSelect={(value) => {
          setLocation(value.label);
          setLocationLat(value.lat);
          setLocationLng(value.lng);
          setMapMode(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#121212" },
  body: { paddingHorizontal: 16, paddingBottom: 28 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  logo: { width: 132, height: 28 },
  headerActions: { flexDirection: "row", alignItems: "center" },
  iconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  cartBadge: {
    position: "absolute",
    top: 2,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: APP_LIME,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3
  },
  cartBadgeText: { color: APP_TEXT_ON_LIME, fontSize: 10, fontWeight: "800" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 },
  titleCopy: { flex: 1 },
  pageTitle: { color: "#ffffff", fontSize: 28, fontWeight: "800" },
  pageSub: { color: APP_TEXT_MUTED, fontSize: 12, marginTop: 2, lineHeight: 16 },
  providerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: APP_LIME,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  providerBtnText: { color: APP_LIME, fontSize: 12, fontWeight: "800" },
  locationBtn: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14, marginBottom: 14 },
  locationKicker: { color: APP_TEXT_MUTED, fontSize: 11, fontWeight: "700" },
  locationValue: { color: APP_TEXT, fontSize: 15, fontWeight: "800", maxWidth: 240 },
  hero: { height: 168, borderRadius: 18, overflow: "hidden", backgroundColor: "#143322", justifyContent: "center" },
  heroImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  heroShade: { ...StyleSheet.absoluteFillObject },
  heroCopy: { paddingHorizontal: 16, maxWidth: "62%" },
  heroTitle: { color: "#ffffff", fontSize: 24, fontWeight: "800", lineHeight: 28 },
  heroTitleAccent: { color: APP_LIME },
  heroSub: { color: "#e7f5dc", fontSize: 12, marginTop: 6, lineHeight: 16 },
  heroBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    backgroundColor: APP_LIME,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  heroBtnText: { color: APP_TEXT_ON_LIME, fontSize: 13, fontWeight: "800" },
  shortcuts: { flexDirection: "row", gap: 10, marginTop: 16 },
  shortcut: {
    flex: 1,
    minHeight: 78,
    borderRadius: 16,
    backgroundColor: "#1c1c1c",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 4,
    paddingVertical: 8
  },
  shortcutOn: { borderWidth: 1.5, borderColor: APP_LIME },
  shortcutText: { color: "#ffffff", fontSize: 11, fontWeight: "700", textAlign: "center" },
  searchRow: { marginTop: 16, marginBottom: 18 },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 12
  },
  searchInput: { flex: 1, color: "#1a1a1a", fontSize: 14, paddingVertical: 12 },
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { color: APP_TEXT, fontSize: 18, fontWeight: "800" },
  viewAll: { color: APP_LIME, fontSize: 14, fontWeight: "700" },
  empty: { color: APP_TEXT_MUTED, marginBottom: 12 },
  cardRow: { gap: 10, paddingRight: 8 },
  photoCard: { width: 148, height: 132, borderRadius: 16, overflow: "hidden", backgroundColor: "#1c1c1c", justifyContent: "flex-end" },
  photo: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  photoShade: { position: "absolute", left: 0, right: 0, bottom: 0, height: 64 },
  photoTitle: { color: "#ffffff", fontSize: 15, fontWeight: "800", paddingHorizontal: 10, paddingBottom: 10 },
  confidence: {
    marginTop: 18,
    borderRadius: 16,
    backgroundColor: "#17341d",
    borderWidth: 1,
    borderColor: "rgba(201,255,53,0.25)",
    padding: 14
  },
  confidenceHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  confidenceTitle: { color: "#ffffff", fontSize: 16, fontWeight: "800" },
  confidenceRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 },
  confidenceItem: { color: "#d7e7c8", fontSize: 12, fontWeight: "700" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#1c1c1c",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 28
  },
  sheetTitle: { color: APP_TEXT, fontSize: 16, fontWeight: "800", marginBottom: 8 },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)"
  },
  sheetLabel: { color: APP_TEXT, fontSize: 16 }
});

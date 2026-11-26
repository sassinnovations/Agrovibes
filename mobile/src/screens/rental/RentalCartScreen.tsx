import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../auth/AuthContext";
import { LocationMapPicker } from "../../components/LocationMapPicker";
import type { RootStackParamList } from "../../navigation/rootStackTypes";
import { useAndroidNestedStackBack } from "../../navigation/useAndroidScreenBack";
import { fetchRentalListings } from "../../services/api";
import { addCustomerBooking } from "../../services/providerWorkflow";
import { saveCustomerRentalBooking, uploadCustomerBookings } from "./customerRentalBookings";
import { BookingDateField } from "./BookingDateField";
import { portalCategoryForListing } from "./rentalCategories";
import { catalogItemById, RENTAL_CATALOG_SUBS } from "./rentalCatalog";
import { clearRentalCart, getRentalCart, rememberRentalCartImages, type RentalCartLine } from "./rentalCart";

const TIMES = ["6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM"];
const GREEN = "#178a45";
const RED = "#e23b3b";

function rupee(n: number) {
  return "\u20B9" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function lineKey(line: RentalCartLine) {
  return `${line.listingId}|${line.option}`;
}

export function RentalCartScreen() {
  useAndroidNestedStackBack();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "RentalCart">>();
  const { user, token } = useAuth();
  const initialPlace =
    route.params?.location && route.params.location !== "Add location"
      ? route.params.location
      : user?.locationLabel?.trim() || "";
  const [lines, setLines] = useState<RentalCartLine[]>([]);
  const [place, setPlace] = useState(initialPlace);
  const [placeLat, setPlaceLat] = useState<number | null>(user?.locationLat ?? null);
  const [placeLng, setPlaceLng] = useState<number | null>(user?.locationLng ?? null);
  const [mapOpen, setMapOpen] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [timeOpen, setTimeOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        const next = await getRentalCart();
        if (!active) return;
        setLines(next);
        const data = await fetchRentalListings(token).catch(() => null);
        if (!active || !data) return;
        const images: Record<string, string> = {};
        for (const row of data.listings || []) {
          const url = String(row.imageUrl || "").trim();
          if (url) images[String(row.id)] = url;
        }
        const filled = await rememberRentalCartImages(images);
        if (active) setLines(filled);
      })();
      return () => {
        active = false;
      };
    }, [token])
  );

  const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);

  const createBooking = async () => {
    if (!lines.length || busy) return;
    if (!date.trim()) {
      setError("Select a date.");
      return;
    }
    if (!time.trim()) {
      setError("Select a time.");
      return;
    }
    if (place.trim().length < 3) {
      setError("Add the location for this booking.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      for (const line of lines) {
        const title = line.quantity > 1 ? `${line.title} × ${line.quantity}` : line.title;
        await saveCustomerRentalBooking({
          listingId: line.listingId,
          title,
          category: line.category,
          location: place,
          date,
          note: `Time ${time}`
        });
        await addCustomerBooking({
          listingId: line.listingId,
          listingTitle: title,
          customerName: user?.fullName?.trim() || "Customer",
          customerPhone: user?.phone?.trim() || "",
          bookingDate: date,
          startTime: time,
          endTime: "",
          duration: line.option,
          pickupLocation: place,
          notes: ""
        });
      }
      await uploadCustomerBookings(token);
      await clearRentalCart();
      setLines([]);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The booking was not saved.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable style={styles.roundBtn} onPress={() => navigation.goBack()} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={20} color="#1a1a1a" />
        </Pressable>
        <Text style={styles.headerTitle}>My Cart</Text>
        <Pressable
          style={styles.roundBtn}
          onPress={() => {
            void clearRentalCart().then(() => {
              setLines([]);
              setDone(false);
            });
          }}
          accessibilityLabel="Clear cart"
        >
          <Ionicons name="trash-outline" size={18} color="#1a1a1a" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {done ? <Text style={styles.done}>Booking created for {date} at {time}.</Text> : null}
        {lines.length === 0 && !done ? <Text style={styles.empty}>Your cart is empty.</Text> : null}
        {lines.map((line) => {
          const uploaded = String(line.imageUrl || "").trim();
          const catalog = catalogItemById(line.listingId);
          const categoryId = portalCategoryForListing(line.category, line.title);
          const fallback = RENTAL_CATALOG_SUBS[categoryId]?.[0]?.image ?? RENTAL_CATALOG_SUBS.machinery[0].image;
          const photo = uploaded ? { uri: uploaded } : catalog?.image ?? fallback;
          const title = line.quantity > 1 ? `${line.title} × ${line.quantity}` : line.title;
          return (
            <View key={lineKey(line)} style={styles.itemCard}>
              <View style={styles.itemCopy}>
                <Text style={styles.itemTitle}>{title}</Text>
                <Text style={styles.itemPrice}>{rupee(line.unitPrice * line.quantity)}</Text>
              </View>
              <Image source={photo} style={styles.photo} resizeMode="cover" />
            </View>
          );
        })}

        {lines.length > 0 ? (
          <>
            <View style={styles.split}>
              <View style={styles.splitCell}>
                <BookingDateField plain label="Date" value={date} onChange={setDate} />
              </View>
              <View style={styles.splitRule} />
              <Pressable style={styles.splitCell} onPress={() => setTimeOpen(true)} accessibilityRole="button">
                <Ionicons name="time-outline" size={18} color="#6b7280" />
                <View>
                  <Text style={styles.fieldLabel}>Time</Text>
                  <Text style={[styles.fieldValue, time ? null : styles.fieldPlaceholder]}>{time || "Select"}</Text>
                </View>
              </Pressable>
            </View>

            <Pressable style={styles.location} onPress={() => setMapOpen(true)} accessibilityRole="button">
              <Ionicons name="location-outline" size={18} color="#6b7280" />
              <View style={styles.locationCopy}>
                <Text style={styles.fieldLabel}>Location</Text>
                <Text style={[styles.fieldValue, place ? null : styles.fieldPlaceholder]}>{place || "Select"}</Text>
              </View>
            </Pressable>

            <Text style={styles.billTitle}>Bill summary</Text>
            <View style={styles.receipt}>
              {lines.map((line) => (
                <View key={`bill-${lineKey(line)}`} style={styles.billRow}>
                  <Text style={styles.billName}>{line.quantity > 1 ? `${line.title} × ${line.quantity}` : line.title}</Text>
                  <Text style={styles.billAmount}>{rupee(line.unitPrice * line.quantity)}</Text>
                </View>
              ))}
              <View style={styles.billRow}>
                <Text style={styles.billName}>Tax</Text>
                <Text style={styles.billAmount}>{rupee(0)}</Text>
              </View>
              <View style={styles.receiptRule} />
              <View style={styles.billRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>{rupee(subtotal)}</Text>
              </View>
              <View style={styles.zigzag}>
                {Array.from({ length: 18 }).map((_, index) => (
                  <View key={index} style={styles.zag} />
                ))}
              </View>
            </View>

            <Text style={styles.disclaimer}>
              <Text style={styles.disclaimerStar}>*Disclaimer{"\n"}</Text>
              Once you click the "proceed to checkout" button, you can not change date, time & location.
            </Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </>
        ) : null}
      </ScrollView>

      {lines.length > 0 ? (
        <View style={styles.footer}>
          <View style={styles.subRow}>
            <Text style={styles.subLabel}>Sub Total</Text>
            <Text style={styles.subValue}>{rupee(subtotal)}</Text>
          </View>
          <Pressable style={styles.createBtn} onPress={() => void createBooking()} disabled={busy}>
            {busy ? <ActivityIndicator color="#1a1a1a" /> : <Text style={styles.createText}>Create Booking</Text>}
          </Pressable>
        </View>
      ) : null}

      <Modal visible={timeOpen} transparent animationType="fade" onRequestClose={() => setTimeOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setTimeOpen(false)}>
          <Pressable style={styles.timeSheet} onPress={() => undefined}>
            <Text style={styles.timeTitle}>Select time</Text>
            {TIMES.map((slot) => (
              <Pressable
                key={slot}
                style={styles.timeRow}
                onPress={() => {
                  setTime(slot);
                  setTimeOpen(false);
                }}
              >
                <Text style={[styles.timeText, slot === time ? styles.timeOn : null]}>{slot}</Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <LocationMapPicker
        open={mapOpen}
        mode="auto"
        label={place}
        lat={placeLat}
        lng={placeLng}
        onClose={() => setMapOpen(false)}
        onSelect={(value) => {
          setPlace(value.label);
          setPlaceLat(value.lat);
          setPlaceLng(value.lng);
          setMapOpen(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#ffffff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  roundBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center"
  },
  headerTitle: { color: "#1a1a1a", fontSize: 18, fontWeight: "800" },
  body: { padding: 16, paddingBottom: 24 },
  empty: { color: "#6b7280", fontSize: 15, marginTop: 24 },
  done: { color: GREEN, fontSize: 15, fontWeight: "700", marginBottom: 12 },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ededed",
    padding: 14,
    marginBottom: 12
  },
  itemCopy: { flex: 1 },
  itemTitle: { color: "#1a1a1a", fontSize: 16, fontWeight: "800" },
  itemPrice: { color: GREEN, fontSize: 16, fontWeight: "800", marginTop: 6 },
  photo: { width: 72, height: 72, borderRadius: 12, backgroundColor: "#f3f4f6" },
  split: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f6f7f8",
    borderRadius: 14,
    marginBottom: 10
  },
  splitCell: { flex: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12 },
  splitRule: { width: 1, alignSelf: "stretch", backgroundColor: "#e5e7eb", marginVertical: 10 },
  fieldLabel: { color: "#6b7280", fontSize: 12, fontWeight: "600" },
  fieldValue: { color: "#1a1a1a", fontSize: 14, fontWeight: "700", marginTop: 2 },
  fieldPlaceholder: { color: "#9ca3af", fontWeight: "600" },
  location: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#f6f7f8",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18
  },
  locationCopy: { flex: 1 },
  billTitle: { color: "#1a1a1a", fontSize: 16, fontWeight: "800", marginBottom: 10 },
  receipt: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ededed",
    borderBottomWidth: 0,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    paddingTop: 14,
    paddingHorizontal: 14,
    overflow: "hidden"
  },
  billRow: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginBottom: 10 },
  billName: { color: "#4b5563", fontSize: 14, flex: 1 },
  billAmount: { color: "#1a1a1a", fontSize: 14, fontWeight: "600" },
  receiptRule: { height: 1, backgroundColor: "#ececec", marginBottom: 10 },
  totalLabel: { color: "#1a1a1a", fontSize: 15, fontWeight: "800" },
  totalValue: { color: GREEN, fontSize: 15, fontWeight: "800" },
  zigzag: { flexDirection: "row", marginHorizontal: -14, marginTop: 4 },
  zag: {
    width: 16,
    height: 16,
    backgroundColor: "#fff",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#ededed",
    transform: [{ rotate: "45deg" }],
    marginTop: -8,
    marginHorizontal: 2
  },
  disclaimer: { color: RED, fontSize: 13, lineHeight: 18, marginTop: 16 },
  disclaimerStar: { fontWeight: "800" },
  error: { color: RED, marginTop: 8, fontSize: 13 },
  footer: { backgroundColor: "#f8f1ea", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  subRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  subLabel: { color: "#1a1a1a", fontSize: 15, fontWeight: "700" },
  subValue: { color: GREEN, fontSize: 16, fontWeight: "800" },
  createBtn: {
    borderWidth: 1,
    borderColor: "#d7d7d7",
    backgroundColor: "#fff",
    borderRadius: 14,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center"
  },
  createText: { color: "#1a1a1a", fontSize: 16, fontWeight: "700" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  timeSheet: { backgroundColor: "#fff", borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, paddingBottom: 28 },
  timeTitle: { color: "#1a1a1a", fontSize: 16, fontWeight: "800", marginBottom: 8 },
  timeRow: { paddingVertical: 10 },
  timeText: { color: "#1a1a1a", fontSize: 15 },
  timeOn: { color: GREEN, fontWeight: "800" }
});

import React, { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../auth/AuthContext";
import { createProviderRazorpayAccount } from "../../../services/api";
import { getProviderRegistrationDraft, updateProviderRegistrationDraft } from "../../../services/providerWorkflow";
import { APP_LIME, APP_TEXT, APP_TEXT_MUTED } from "../../../theme/appColors";

function lastDigits(value: string, max: number) {
  return value.replace(/\D/g, "").slice(-max);
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function missingDetail(fields: { email: string; phone: string; street: string; city: string; stateName: string; postalCode: string }) {
  if (!isEmail(fields.email)) return "Enter an email address. A mobile number cannot be used as the email.";
  if (lastDigits(fields.phone, 10).length !== 10) return "Add the 10-digit mobile number.";
  if (fields.street.trim().length <= 1) return "Add the street.";
  if (fields.city.trim().length <= 1) return "Add the city.";
  if (fields.stateName.trim().length <= 1) return "Add the state.";
  if (lastDigits(fields.postalCode, 6).length !== 6) return "Add the 6-digit postal PIN code for this address.";
  return "";
}

export function ProviderPayoutsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { token, user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [saved, setSaved] = useState({ email: false, phone: false, street: false, city: false, stateName: false, postalCode: false });

  useFocusEffect(
    useCallback(() => {
      void getProviderRegistrationDraft().then((draft) => {
        const storedEmail = (draft?.email || user?.email || "").trim();
        const emailIsReal = isEmail(storedEmail);
        const phoneFromEmail = emailIsReal ? "" : lastDigits(storedEmail, 10);
        const nextPhone = lastDigits(draft?.phone || user?.phone || phoneFromEmail, 10);
        const nextStreet = (draft?.street || draft?.village || "").trim();
        const nextCity = (draft?.district || draft?.village || "").trim();
        const nextState = (draft?.state || "").trim();
        const nextPin = lastDigits(draft?.pinCode || "", 6);
        setEmail(emailIsReal ? storedEmail : "");
        setPhone(nextPhone);
        setStreet(nextStreet);
        setCity(nextCity);
        setStateName(nextState);
        setPostalCode(nextPin);
        setSaved({
          email: emailIsReal,
          phone: nextPhone.length === 10,
          street: nextStreet.length > 1,
          city: nextCity.length > 1,
          stateName: nextState.length > 1,
          postalCode: nextPin.length === 6
        });
        if (!emailIsReal && storedEmail) {
          setNote("Registration saved a mobile number in the email field. Enter an email address here.");
        }
      });
    }, [user?.email, user?.phone])
  );

  const link = async () => {
    if (!token) return;
    const draft = await getProviderRegistrationDraft();
    if (!draft?.bankVerified || !draft.accountNumber || !draft.ifsc || !draft.holderName) {
      Alert.alert("Bank account", "Verify the bank account, IFSC, and account holder before linking Razorpay.");
      navigation.navigate("ProviderBankDetails", { purpose: "payouts" });
      return;
    }
    const problem = missingDetail({ email, phone, street, city, stateName, postalCode });
    if (problem) {
      setNote(problem);
      return;
    }
    setBusy(true);
    setNote("");
    try {
      const pin = lastDigits(postalCode, 6);
      const mobile = lastDigits(phone, 10);
      const result = await createProviderRazorpayAccount(token, {
        accountNumber: draft.accountNumber,
        ifsc: draft.ifsc,
        holderName: draft.holderName,
        email: email.trim(),
        phone: mobile,
        businessName: draft.businessName || draft.fullName || draft.holderName,
        street: street.trim(),
        city: city.trim(),
        state: stateName.trim(),
        postalCode: pin
      });
      if (!result.linked || !result.accountId) {
        setNote(result.message || "Razorpay did not link an account.");
        return;
      }
      await updateProviderRegistrationDraft({
        razorpayAccountId: result.accountId,
        email: email.trim(),
        phone: mobile,
        street: street.trim(),
        district: city.trim(),
        state: stateName.trim(),
        pinCode: pin
      });
      Alert.alert("Razorpay linked", "This provider account can receive payouts.", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Razorpay is not ready.");
    } finally {
      setBusy(false);
    }
  };

  const row = (
    label: string,
    value: string,
    locked: boolean,
    onChange: (value: string) => void,
    options?: { numeric?: boolean; maxLength?: number; keyboard?: "email-address" | "number-pad" | "default" }
  ) =>
    locked ? (
      <View key={label}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.readonly}>{value}</Text>
      </View>
    ) : (
      <View key={label}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder={label}
          placeholderTextColor={APP_TEXT_MUTED}
          keyboardType={options?.keyboard || (options?.numeric ? "number-pad" : "default")}
          autoCapitalize="none"
          maxLength={options?.maxLength ?? 80}
        />
      </View>
    );

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Receive payments</Text>
        <Text style={styles.sub}>
          Razorpay needs an email address, not the mobile number. Saved registration details stay as they are. Fill any line that is empty.
        </Text>
        {row("Email", email, saved.email, setEmail, { keyboard: "email-address" })}
        {row("Mobile", phone, saved.phone, (value) => setPhone(lastDigits(value, 10)), { numeric: true, maxLength: 10 })}
        {row("Street", street, saved.street, setStreet)}
        {row("City", city, saved.city, setCity)}
        {row("State", stateName, saved.stateName, setStateName)}
        {row("PIN code", postalCode, saved.postalCode, (value) => setPostalCode(lastDigits(value, 6)), { numeric: true, maxLength: 6 })}
        {note ? <Text style={styles.note}>{note}</Text> : null}
        <Pressable style={styles.button} disabled={busy} onPress={() => void link()}>
          <Text style={styles.buttonText}>{busy ? "Contacting Razorpay…" : "Set up Razorpay account"}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#1a1a1a" },
  body: { padding: 16, paddingBottom: 32 },
  title: { color: APP_TEXT, fontSize: 28, fontWeight: "800" },
  sub: { color: APP_TEXT_MUTED, marginTop: 8, lineHeight: 20 },
  label: { color: APP_TEXT_MUTED, marginTop: 16, fontSize: 12, fontWeight: "700" },
  readonly: {
    color: APP_TEXT,
    backgroundColor: "#2b2c2e",
    borderRadius: 10,
    padding: 14,
    marginTop: 6,
    fontWeight: "700"
  },
  input: { backgroundColor: "#2b2c2e", color: APP_TEXT, borderRadius: 10, padding: 14, marginTop: 6 },
  note: { color: "#ffb4b4", marginTop: 14 },
  button: { backgroundColor: APP_LIME, borderRadius: 12, alignItems: "center", paddingVertical: 14, marginTop: 20 },
  buttonText: { color: "#111", fontWeight: "800" }
});

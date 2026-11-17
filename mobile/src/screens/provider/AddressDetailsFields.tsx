import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text, TextInput, View, StyleSheet } from "react-native";
import { fetchLocationCities, fetchLocationDistricts, fetchLocationStates } from "../../services/api";
import { PROVIDER_MUTED, PROVIDER_TEXT, providerFormStyles as pf } from "./providerFormUi";

type Props = {
  address: string;
  stateName: string;
  district: string;
  city: string;
  pinCode: string;
  onChangeAddress: (value: string) => void;
  onChangeState: (value: string) => void;
  onChangeDistrict: (value: string) => void;
  onChangeCity: (value: string) => void;
  onChangePin: (value: string) => void;
};

export function AddressDetailsFields({
  address,
  stateName,
  district,
  city,
  pinCode,
  onChangeAddress,
  onChangeState,
  onChangeDistrict,
  onChangeCity,
  onChangePin
}: Props) {
  const [states, setStates] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    fetchLocationStates()
      .then((result) => {
        if (active) setStates(result.states.map((item) => item.name));
      })
      .catch(() => {
        if (active) setLoadError("Could not load states.");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!stateName) {
      setDistricts([]);
      return;
    }
    let active = true;
    fetchLocationDistricts(stateName)
      .then((result) => {
        if (active) setDistricts(result.districts);
      })
      .catch(() => {
        if (active) setLoadError("Could not load districts.");
      });
    return () => {
      active = false;
    };
  }, [stateName]);

  useEffect(() => {
    if (!stateName || !district) {
      setCities([]);
      return;
    }
    let active = true;
    fetchLocationCities(stateName, district)
      .then((result) => {
        if (active) setCities(result.cities);
      })
      .catch(() => {
        if (active) setLoadError("Could not load cities.");
      });
    return () => {
      active = false;
    };
  }, [stateName, district]);

  return (
    <View>
      <Text style={[pf.sectionTitle, { marginTop: 14, fontSize: 18 }]}>Address details</Text>
      <Text style={styles.label}>Address</Text>
      <TextInput
        style={pf.input}
        value={address}
        onChangeText={onChangeAddress}
        placeholder="Enter address"
        placeholderTextColor={PROVIDER_MUTED}
      />
      <PlaceField
        label="State"
        value={stateName}
        placeholder="Type state"
        options={states}
        onChange={(name) => {
          onChangeState(name);
          onChangeDistrict("");
          onChangeCity("");
        }}
      />
      <PlaceField
        label="District"
        value={district}
        placeholder="Type district"
        options={districts}
        disabled={!stateName}
        onChange={(name) => {
          onChangeDistrict(name);
          onChangeCity("");
        }}
      />
      <PlaceField
        label="City"
        value={city}
        placeholder="Type city"
        options={cities}
        disabled={!district}
        onChange={onChangeCity}
      />
      <Text style={styles.label}>PIN code</Text>
      <TextInput
        style={pf.input}
        value={pinCode}
        onChangeText={(value) => onChangePin(value.replace(/\D/g, "").slice(0, 6))}
        placeholder="6-digit PIN code"
        placeholderTextColor={PROVIDER_MUTED}
        keyboardType="number-pad"
        maxLength={6}
      />
      {loadError ? <Text style={styles.error}>{loadError}</Text> : null}
    </View>
  );
}

function PlaceField({
  label,
  value,
  placeholder,
  options,
  disabled,
  onChange
}: {
  label: string;
  value: string;
  placeholder: string;
  options: string[];
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const [text, setText] = useState(value);
  const [focused, setFocused] = useState(false);
  const picking = useRef(false);
  useEffect(() => {
    setText(value);
  }, [value]);
  const shown = useMemo(() => {
    const needle = text.trim().toLowerCase();
    if (!needle) return [];
    const starts = options.filter((name) => name.toLowerCase().startsWith(needle));
    const contains = options.filter((name) => !name.toLowerCase().startsWith(needle) && name.toLowerCase().includes(needle));
    return [...starts, ...contains];
  }, [options, text]);
  const open = focused && text.trim().length > 0;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[pf.input, disabled && styles.inputOff]}
        value={text}
        editable={!disabled}
        placeholder={placeholder}
        placeholderTextColor={PROVIDER_MUTED}
        autoCorrect={false}
        autoCapitalize="words"
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          if (!picking.current) setText(value);
          picking.current = false;
        }}
        onChangeText={(next) => {
          setText(next);
          if (!next.trim()) onChange("");
        }}
      />
      {open ? (
        <View style={styles.menu}>
          {shown.length === 0 ? (
            <Text style={styles.empty}>No places found.</Text>
          ) : (
            shown.map((name) => (
              <Pressable
                key={name}
                style={styles.option}
                onPressIn={() => {
                  picking.current = true;
                  setText(name);
                  onChange(name);
                  setFocused(false);
                }}
              >
                <Text style={[styles.optionText, name === value && styles.optionActive]}>{name}</Text>
              </Pressable>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: PROVIDER_TEXT, fontSize: 13, fontWeight: "600", marginBottom: 8 },
  field: { marginBottom: 10, zIndex: 1 },
  inputOff: { opacity: 0.55 },
  menu: {
    marginTop: 4,
    maxHeight: 220,
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    overflow: "hidden"
  },
  option: { paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)" },
  optionText: { color: PROVIDER_TEXT, fontSize: 15 },
  optionActive: { color: "#c9ff35" },
  empty: { color: PROVIDER_MUTED, paddingVertical: 14, paddingHorizontal: 14 },
  error: { color: "#ff8a80", fontSize: 13, marginBottom: 8 }
});

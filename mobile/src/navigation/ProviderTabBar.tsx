import React from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import type { ImageSourcePropType } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { APP_BLACK, APP_LIME } from "../theme/appColors";

const ICON_SIZE = 22;

const TAB_ICONS = {
  Overview: require("../../assets/provider/bottom-icons/overview.png"),
  Rental: require("../../assets/provider/bottom-icons/rental.png"),
  Listing: require("../../assets/provider/bottom-icons/listings.png"),
  Services: require("../../assets/provider/bottom-icons/services.png"),
  Profile: require("../../assets/provider/bottom-icons/profile.png")
} as const;

const TAB_META: Record<string, { label: string; icon: ImageSourcePropType }> = {
  Overview: { label: "Overview", icon: TAB_ICONS.Overview },
  Rental: { label: "Rental", icon: TAB_ICONS.Rental },
  Listing: { label: "Listing", icon: TAB_ICONS.Listing },
  Services: { label: "Services", icon: TAB_ICONS.Services },
  Profile: { label: "Profile", icon: TAB_ICONS.Profile }
};

export function ProviderTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 8 : Math.max(insets.bottom, 8);

  return (
    <View style={[styles.bar, { paddingBottom: bottomPad }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const meta = TAB_META[route.name] ?? { label: route.name, icon: TAB_ICONS.Overview };
        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={[styles.item, focused ? styles.itemActive : null]}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={descriptors[route.key]?.options.tabBarAccessibilityLabel ?? meta.label}
          >
            <Image source={meta.icon} style={[styles.icon, focused ? styles.iconActive : null]} resizeMode="contain" />
            <Text style={[styles.label, focused ? styles.labelActive : null]} numberOfLines={1}>
              {meta.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: APP_BLACK,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingTop: 6
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    minHeight: 52,
    paddingVertical: 4
  },
  itemActive: {
    borderTopWidth: 2,
    borderTopColor: APP_LIME,
    marginTop: -6,
    paddingTop: 8
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    tintColor: "#FFFFFF"
  },
  iconActive: {
    tintColor: APP_LIME
  },
  label: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600"
  },
  labelActive: {
    color: APP_LIME
  }
});

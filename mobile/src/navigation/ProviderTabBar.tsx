import React from "react";
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import type { ImageSourcePropType } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BAR_BG = "#262626";
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

export function providerSidebarWidth(windowWidth: number) {
  return windowWidth >= 760 ? 220 : 84;
}

export function ProviderTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= 760;
  const sidebarWidth = providerSidebarWidth(width);

  return (
    <View
      style={[
        styles.sidebar,
        {
          width: sidebarWidth,
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 16)
        }
      ]}
    >
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
            style={[styles.item, wide ? styles.itemWide : null, focused ? styles.itemActive : null]}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={descriptors[route.key]?.options.tabBarAccessibilityLabel ?? meta.label}
          >
            <Image
              source={meta.icon}
              style={[styles.icon, focused ? styles.iconActive : null]}
              resizeMode="contain"
            />
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
  sidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 20,
    backgroundColor: BAR_BG,
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 10,
    gap: 6
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minHeight: 56,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 6
  },
  itemWide: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 12,
    paddingHorizontal: 12
  },
  itemActive: {
    backgroundColor: "rgba(201, 255, 53, 0.12)"
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    tintColor: "#FFFFFF"
  },
  iconActive: {
    tintColor: "#c9ff35"
  },
  label: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600"
  },
  labelActive: {
    color: "#c9ff35"
  }
});

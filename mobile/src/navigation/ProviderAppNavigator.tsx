import React from "react";
import { StyleSheet, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { ProviderTabBar } from "./ProviderTabBar";

export type ProviderTabParamList = {
  Overview: undefined;
  Rental: undefined;
  Listing: undefined;
  Services: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<ProviderTabParamList>();

/**
 * Separate provider business shell (Overview / Rental / Listing / Services / Profile).
 * Farmer social tabs remain in AppNavigator.
 */
export function ProviderAppNavigator() {
  return (
    <View style={styles.root}>
      <Tab.Navigator
        initialRouteName="Overview"
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          lazy: true,
          freezeOnBlur: true,
          sceneContainerStyle: {
            backgroundColor: "#303132"
          },
          tabBarStyle: {
            display: "none"
          }
        }}
        safeAreaInsets={{ top: 0 }}
        detachInactiveScreens
        tabBar={(props) => <ProviderTabBar {...props} />}
      >
        <Tab.Screen
          name="Overview"
          getComponent={() =>
            require("../screens/provider/dashboard/ProviderOverviewScreen").ProviderOverviewScreen
          }
        />
        <Tab.Screen
          name="Rental"
          getComponent={() =>
            require("../screens/provider/dashboard/ProviderRentalScreen").ProviderRentalScreen
          }
        />
        <Tab.Screen
          name="Listing"
          getComponent={() =>
            require("../screens/provider/dashboard/ProviderListingScreen").ProviderListingScreen
          }
        />
        <Tab.Screen
          name="Services"
          getComponent={() =>
            require("../screens/provider/dashboard/ProviderServicesHubScreen").ProviderServicesHubScreen
          }
        />
        <Tab.Screen
          name="Profile"
          getComponent={() =>
            require("../screens/provider/dashboard/ProviderProfileScreen").ProviderProfileScreen
          }
        />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#303132" }
});

// App.js — 1Life Hub
import React, { useState, useEffect, useRef } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import AsyncStorage from "@react-native-async-storage/async-storage";

import TodayScreen from "./screens/Today";
import PhysicalScreen from "./screens/Physical";
import RoutineScreen from "./screens/Routine";
import HabitsScreen from "./screens/HabitsScreen";
import MeetingsScreen from "./screens/MeetingsScreen";
import DeadlinesScreen from "./screens/DeadlinesScreen";
import OnboardingScreen from "./screens/OnboardingScreen";

// Set to true to force onboarding every launch (testing only)
const FORCE_ONBOARDING = true;

function MainApp() {
  const [screen, setScreen] = useState({ name: "Today", params: {} });
  const listenersRef = useRef({});

  const fireFocus = (name) => {
    setTimeout(() => {
      (listenersRef.current[name] || []).forEach((fn) => fn());
    }, 50);
  };

  const navigate = (name, params = {}) => {
    setScreen({ name, params });
    fireFocus(name);
  };

  const goBack = () => {
    setScreen({ name: "Today", params: {} });
    fireFocus("Today");
  };

  const makeNavigation = (screenName) => ({
    navigate,
    goBack,
    addListener: (event, callback) => {
      if (event === "focus") {
        if (!listenersRef.current[screenName])
          listenersRef.current[screenName] = [];
        if (!listenersRef.current[screenName].includes(callback))
          listenersRef.current[screenName].push(callback);
      }
      return () => {
        if (listenersRef.current[screenName])
          listenersRef.current[screenName] = listenersRef.current[
            screenName
          ].filter((fn) => fn !== callback);
      };
    },
  });

  const makeRoute = (params = {}) => ({ params });
  const { name, params } = screen;

  switch (name) {
    case "Physical":
      return (
        <PhysicalScreen
          navigation={makeNavigation("Physical")}
          route={makeRoute(params)}
        />
      );
    case "Routine":
      return (
        <RoutineScreen
          navigation={makeNavigation("Routine")}
          route={makeRoute(params)}
        />
      );
    case "Habits":
      return (
        <HabitsScreen
          navigation={makeNavigation("Habits")}
          route={makeRoute(params)}
        />
      );
    case "Meetings":
      return (
        <MeetingsScreen
          navigation={makeNavigation("Meetings")}
          route={makeRoute(params)}
        />
      );
    case "Deadlines":
      return (
        <DeadlinesScreen
          navigation={makeNavigation("Deadlines")}
          route={makeRoute(params)}
        />
      );
    default:
      return (
        <TodayScreen
          navigation={makeNavigation("Today")}
          route={makeRoute(params)}
        />
      );
  }
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Orbitron: require("./assets/fonts/Orbitron-Bold.ttf"),
    Inter: require("./assets/fonts/Inter-Regular.ttf"),
    "Inter-Bold": require("./assets/fonts/Inter-Bold.ttf"),
  });

  const [onboardingDone, setOnboardingDone] = useState(null);

  useEffect(() => {
    if (FORCE_ONBOARDING) {
      AsyncStorage.removeItem("onboarding_done").then(() =>
        setOnboardingDone(false),
      );
    } else {
      AsyncStorage.getItem("onboarding_done").then((val) =>
        setOnboardingDone(val === "true"),
      );
    }
  }, []);

  if (!fontsLoaded || onboardingDone === null) return null;

  return (
    <SafeAreaProvider>
      {onboardingDone ? (
        <MainApp />
      ) : (
        <OnboardingScreen onDone={() => setOnboardingDone(true)} />
      )}
    </SafeAreaProvider>
  );
}

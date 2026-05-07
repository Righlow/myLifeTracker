// App.js — 1Life Hub
import React, { useState, useEffect, useRef } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import AsyncStorage from "@react-native-async-storage/async-storage";

import TodayScreen from "./screens/Today";
import HabitsScreen from "./screens/HabitsScreen";
import GoalsScreen from "./screens/GoalsScreen";
import PhysicalScreen from "./screens/Physical";
import OnboardingScreen from "./screens/OnboardingScreen";
import MeetingsScreen from "./screens/MeetingsScreen";
import DeadlinesScreen from "./screens/DeadlinesScreen";

function MainApp() {
  const [screen, setScreen] = useState("Today");
  const listenersRef = useRef({});

  const navigate = (name) => {
    setScreen(name);
    setTimeout(() => {
      const fns = listenersRef.current[name] || [];
      fns.forEach((fn) => fn());
    }, 100);
  };

  const makeNavigation = (screenName) => ({
    navigate,
    goBack: () => navigate("Today"),
    addListener: (event, callback) => {
      if (event === "focus") {
        if (!listenersRef.current[screenName]) {
          listenersRef.current[screenName] = [];
        }
        listenersRef.current[screenName].push(callback);
      }
      return () => {
        if (listenersRef.current[screenName]) {
          listenersRef.current[screenName] = listenersRef.current[
            screenName
          ].filter((fn) => fn !== callback);
        }
      };
    },
  });

  switch (screen) {
    case "Habits":
      return <HabitsScreen navigation={makeNavigation("Habits")} />;
    case "Goals":
      return <GoalsScreen navigation={makeNavigation("Goals")} />;
    case "Physical":
      return <PhysicalScreen navigation={makeNavigation("Physical")} />;
    case "Meetings":
      return <MeetingsScreen navigation={makeNavigation("Meetings")} />;
    case "Deadlines":
      return <DeadlinesScreen navigation={makeNavigation("Deadlines")} />;
    default:
      return <TodayScreen navigation={makeNavigation("Today")} />;
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
    AsyncStorage.removeItem("onboarding_done").then(() => {
      setOnboardingDone(false);
    });
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

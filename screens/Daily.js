import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Slider from "@react-native-community/slider";
import { healthStore } from "../store";
import { COLORS } from "../constants/colors";

const GREEN = COLORS.neonGreen;
const RED = COLORS.neonRed;
const MUTED = COLORS.textMuted;

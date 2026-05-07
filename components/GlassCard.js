import React from "react";

import { View, TouchableOpacity, StyleSheet } from "react-native";

import { BlurView } from "expo-blur";

import COLORS from "../constants/colors";

export default function GlassCard({ children, style, accentColor, onPress }) {
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      activeOpacity={0.9}
      onPress={onPress}
      style={[
        styles.card,

        accentColor && {
          borderLeftWidth: 3,
          borderLeftColor: accentColor,
        },

        style,
      ]}
    >
      <BlurView intensity={25} tint="dark" style={styles.blur}>
        {children}
      </BlurView>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",

    borderRadius: 24,

    backgroundColor: COLORS.card,

    borderWidth: 1,
    borderColor: COLORS.border,

    marginBottom: 16,
  },

  blur: {
    padding: 18,
  },
});

import React from "react";

import { View, Text, StyleSheet, Switch } from "react-native";

import GlassCard from "./GlassCard";

import COLORS from "../constants/colors";

export default function HabitCard({ title, category, xp, active, onToggle }) {
  const accent = COLORS.domains[category];

  return (
    <GlassCard accentColor={accent}>
      <View style={styles.row}>
        <View>
          <Text style={styles.title}>{title}</Text>

          <Text style={[styles.meta, { color: accent }]}>
            {category} • +{xp} XP
          </Text>
        </View>

        <Switch
          value={active}
          onValueChange={onToggle}
          trackColor={{
            false: "#222",
            true: `${accent}55`,
          }}
          thumbColor={accent}
        />
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",
  },

  title: {
    color: COLORS.text,

    fontSize: 18,

    fontFamily: "Inter-Bold",

    marginBottom: 4,
  },

  meta: {
    fontSize: 13,

    fontFamily: "Inter",
  },
});

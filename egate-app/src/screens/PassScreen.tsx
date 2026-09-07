import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable, Share } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation";
import { listVisitors, updateStatus } from "../storage";
import { colors, spacing } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Pass">;

export function PassScreen({ navigation, route }: Props) {
  const visitor = useMemo(
    () => listVisitors().find((v) => v.id === route.params.id),
    [route.params.id]
  );

  if (!visitor) {
    return (
      <View style={styles.screen}>
        <Text style={styles.title}>Pass not found</Text>
        <Pressable onPress={() => navigation.navigate("Home")}>
          <Text style={styles.link}>Back home</Text>
        </Pressable>
      </View>
    );
  }

  const time = new Date(visitor.createdAt).toLocaleString();

  async function sharePass() {
    await Share.share({
      message: `eGate pass\n${visitor!.name}\nHost: ${visitor!.host}\nPurpose: ${visitor!.purpose}\nIn: ${time}\nhttps://egate.co.in`,
    });
  }

  function approve() {
    updateStatus(visitor!.id, "approved");
    navigation.navigate("Today");
  }

  function markExit() {
    updateStatus(visitor!.id, "exited");
    navigation.navigate("Today");
  }

  return (
    <View style={styles.screen}>
      <View style={styles.pass}>
        <Text style={styles.brand}>eGate pass</Text>
        <Text style={styles.name}>{visitor.name}</Text>
        <Text style={styles.meta}>Host: {visitor.host}</Text>
        <Text style={styles.meta}>Purpose: {visitor.purpose}</Text>
        {visitor.phone ? (
          <Text style={styles.meta}>Phone: {visitor.phone}</Text>
        ) : null}
        <Text style={styles.meta}>In: {time}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{visitor.status.toUpperCase()}</Text>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
        onPress={approve}
      >
        <Text style={styles.primaryText}>Mark approved</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
        onPress={sharePass}
      >
        <Text style={styles.secondaryText}>Share pass</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
        onPress={markExit}
      >
        <Text style={styles.secondaryText}>Mark exit</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.sand,
    padding: spacing.lg,
  },
  pass: {
    backgroundColor: colors.ink,
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  brand: {
    fontFamily: "Manrope_600SemiBold",
    color: "#A8D4CF",
    letterSpacing: 1,
    textTransform: "uppercase",
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  name: {
    fontFamily: "Manrope_700Bold",
    color: colors.paper,
    fontSize: 30,
    marginBottom: spacing.sm,
  },
  meta: {
    fontFamily: "Manrope_400Regular",
    color: "#D5EBE7",
    fontSize: 15,
    marginBottom: 4,
  },
  badge: {
    alignSelf: "flex-start",
    marginTop: spacing.md,
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    fontFamily: "Manrope_700Bold",
    color: colors.paper,
    fontSize: 12,
  },
  primary: {
    backgroundColor: colors.ink,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  primaryText: {
    fontFamily: "Manrope_600SemiBold",
    color: colors.paper,
    textAlign: "center",
    fontSize: 16,
  },
  secondary: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  secondaryText: {
    fontFamily: "Manrope_600SemiBold",
    color: colors.ink,
    textAlign: "center",
    fontSize: 16,
  },
  pressed: { opacity: 0.88 },
  title: {
    fontFamily: "Manrope_700Bold",
    fontSize: 22,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  link: {
    fontFamily: "Manrope_600SemiBold",
    color: colors.accent,
  },
});

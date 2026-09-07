import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Linking,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation";
import { colors, spacing } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export function HomeScreen({ navigation }: Props) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Text style={styles.brand}>eGate</Text>
        <Text style={styles.headline}>
          Know who is at the gate — without the chaos
        </Text>
        <Text style={styles.lede}>
          Check visitors in, notify hosts, and issue a pass from your phone.
        </Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
        onPress={() => navigation.navigate("CheckIn")}
      >
        <Text style={styles.primaryText}>New visitor check-in</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
        onPress={() => navigation.navigate("Today")}
      >
        <Text style={styles.secondaryText}>Today’s visitors</Text>
      </Pressable>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>How it works</Text>
        <Text style={styles.step}>1. Visitor arrives — enter name, host, purpose</Text>
        <Text style={styles.step}>2. Host is notified — approve or hold</Text>
        <Text style={styles.step}>3. Pass is issued — show, print, or share</Text>
        <Text style={styles.step}>4. Exit is logged — clear day record</Text>
      </View>

      <Pressable onPress={() => Linking.openURL("https://egate.co.in/")}>
        <Text style={styles.link}>egate.co.in</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sand },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  hero: { marginTop: spacing.md, marginBottom: spacing.lg },
  brand: {
    fontFamily: "Manrope_700Bold",
    fontSize: 18,
    letterSpacing: 1.2,
    color: colors.ink,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  headline: {
    fontFamily: "Manrope_700Bold",
    fontSize: 32,
    lineHeight: 38,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  lede: {
    fontFamily: "Manrope_400Regular",
    fontSize: 16,
    lineHeight: 24,
    color: colors.muted,
  },
  primary: {
    backgroundColor: colors.ink,
    paddingVertical: 16,
    paddingHorizontal: 20,
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
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  secondaryText: {
    fontFamily: "Manrope_600SemiBold",
    color: colors.ink,
    textAlign: "center",
    fontSize: 16,
  },
  pressed: { opacity: 0.88 },
  card: {
    backgroundColor: colors.mist,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontFamily: "Manrope_700Bold",
    fontSize: 18,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  step: {
    fontFamily: "Manrope_400Regular",
    fontSize: 15,
    lineHeight: 24,
    color: colors.inkSoft,
    marginBottom: 6,
  },
  link: {
    fontFamily: "Manrope_600SemiBold",
    color: colors.accent,
    textAlign: "center",
    fontSize: 15,
  },
});

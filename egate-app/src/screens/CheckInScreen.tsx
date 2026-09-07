import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation";
import { addVisitor } from "../storage";
import { colors, spacing } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "CheckIn">;

export function CheckInScreen({ navigation }: Props) {
  const [name, setName] = useState("");
  const [host, setHost] = useState("");
  const [purpose, setPurpose] = useState("");
  const [phone, setPhone] = useState("");

  function submit() {
    if (!name.trim() || !host.trim() || !purpose.trim()) {
      Alert.alert("Missing details", "Name, host, and purpose are required.");
      return;
    }
    const visitor = addVisitor({
      name: name.trim(),
      host: host.trim(),
      purpose: purpose.trim(),
      phone: phone.trim() || undefined,
    });
    navigation.replace("Pass", { id: visitor.id });
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Visitor check-in</Text>
        <Text style={styles.lede}>
          Capture who is at the gate. Host approval can follow in a later
          release.
        </Text>

        <Field label="Visitor name" value={name} onChangeText={setName} />
        <Field label="Host / flat / desk" value={host} onChangeText={setHost} />
        <Field label="Purpose" value={purpose} onChangeText={setPurpose} />
        <Field
          label="Phone (optional)"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <Pressable
          style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
          onPress={submit}
        >
          <Text style={styles.primaryText}>Issue gate pass</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: "default" | "phone-pad";
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholderTextColor={colors.muted}
        autoCapitalize="words"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.sand },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  title: {
    fontFamily: "Manrope_700Bold",
    fontSize: 28,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  lede: {
    fontFamily: "Manrope_400Regular",
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted,
    marginBottom: spacing.lg,
  },
  field: { marginBottom: spacing.md },
  label: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13,
    color: colors.inkSoft,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: "Manrope_400Regular",
    fontSize: 16,
    color: colors.ink,
  },
  primary: {
    backgroundColor: colors.ink,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: spacing.sm,
  },
  primaryText: {
    fontFamily: "Manrope_600SemiBold",
    color: colors.paper,
    textAlign: "center",
    fontSize: 16,
  },
  pressed: { opacity: 0.88 },
});

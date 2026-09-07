import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation";
import { listVisitors } from "../storage";
import { Visitor } from "../types";
import { colors, spacing } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Today">;

export function TodayScreen({ navigation }: Props) {
  const [items, setItems] = useState<Visitor[]>([]);

  useFocusEffect(
    useCallback(() => {
      setItems(listVisitors());
    }, [])
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={styles.title}>Today’s visitors</Text>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            No check-ins yet. Start with a new visitor at the gate.
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => navigation.navigate("Pass", { id: item.id })}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>
                {item.host} · {item.purpose}
              </Text>
            </View>
            <Text style={styles.status}>{item.status}</Text>
          </Pressable>
        )}
      />
      <Pressable
        style={({ pressed }) => [styles.primary, pressed && { opacity: 0.88 }]}
        onPress={() => navigation.navigate("CheckIn")}
      >
        <Text style={styles.primaryText}>New check-in</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sand, padding: spacing.lg },
  list: { paddingBottom: spacing.lg },
  title: {
    fontFamily: "Manrope_700Bold",
    fontSize: 28,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  empty: {
    fontFamily: "Manrope_400Regular",
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.paper,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
  },
  name: {
    fontFamily: "Manrope_700Bold",
    fontSize: 16,
    color: colors.ink,
  },
  meta: {
    fontFamily: "Manrope_400Regular",
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  status: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 12,
    color: colors.inkSoft,
    textTransform: "uppercase",
  },
  primary: {
    backgroundColor: colors.ink,
    paddingVertical: 16,
    borderRadius: 12,
  },
  primaryText: {
    fontFamily: "Manrope_600SemiBold",
    color: colors.paper,
    textAlign: "center",
    fontSize: 16,
  },
});

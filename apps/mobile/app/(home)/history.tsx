import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { FlashList } from "@shopify/flash-list";

import { ThemedText } from "../../components/ThemedText";
import { PageHeader } from "../../components/PageHeader";
import { GlassView } from "../../components/GlassView";
import { Ionicons } from "@expo/vector-icons";
import { getApproximateScreenCornerRadius } from "../../lib/utils";
import { ThemedView } from "../../components/ThemedView";

const ExampleReports = [
  {
    id: "1",
    summary: "Fever, cough, and fatigue",
    date: "2024-06-15",
  },
  {
    id: "2",
    summary: "Headache and sore throat",
    date: "2024-06-10",
  },
  {
    id: "3",
    summary: "Mild chest pain",
    date: "2024-06-05",
  },
  {
    id: "4",
    summary: "Shortness of breath",
    date: "2024-06-01",
  },
  {
    id: "5",
    summary: "Nausea and vomiting",
    date: "2024-05-28",
  },
  {
    id: "6",
    summary: "Dizziness and blurred vision",
    date: "2024-05-20",
  },
  {
    id: "7",
    summary: "Abdominal pain",
    date: "2024-05-15",
  },
  {
    id: "8",
    summary: "Joint pain and swelling",
    date: "2024-05-10",
  },
  {
    id: "9",
    summary: "Skin rash and itching",
    date: "2024-05-05",
  },
  {
    id: "10",
    summary: "Back pain and stiffness",
    date: "2024-05-01",
  },
];

export default function Page() {
  const borderRadius = getApproximateScreenCornerRadius();

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <View style={styles.page}>
        <PageHeader title="History" />
        <View style={{ flex: 1, padding: 20 }}>
          <ThemedView
            style={{
              flex: 1,
              backgroundColor: "#fff",
              borderTopLeftRadius: borderRadius.dp / 2,
              borderTopRightRadius: borderRadius.dp / 2,
              borderBottomLeftRadius: borderRadius.dp,
              borderBottomRightRadius: borderRadius.dp,
            }}
            thinBorder
          >
            <FlashList
              style={{ flex: 1 }}
              data={ExampleReports}
              renderItem={({ item }) => (
                <View
                  style={{
                    padding: 15,
                    borderBottomWidth: 1,
                    borderBottomColor: "#eee",
                  }}
                >
                  <ThemedText style={{ fontSize: 16, fontWeight: "bold" }}>
                    {item.summary}
                  </ThemedText>
                  <ThemedText style={{ fontSize: 14, color: "#666" }}>
                    {item.date}
                  </ThemedText>
                </View>
              )}
            />
          </ThemedView>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f2f2f2" },
  header: {
    width: "100%",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
});

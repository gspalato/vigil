import { StyleSheet, Text, TextStyle } from "react-native";

type ThemedTextProps = {
  children: string | string[];
  style?: TextStyle;
  size?: "sm" | "md" | "lg" | "xl";
  type?: "title" | "body" | "caption" | "button"; // Future use for different text types
};

export const ThemedText = ({
  children,
  style,
  size = "md",
  type = "body",
}: ThemedTextProps) => {
  const textSize = {
    sm: {
      fontSize: 16,
    },
    md: {
      fontSize: 20,
    },
    lg: {
      fontSize: 32,
    },
    xl: {
      fontSize: 42,
    },
  };

  return (
    <Text
      style={[
        styles.text,
        type === "title" && styles.title,
        type === "body" && styles.body,
        type === "caption" && styles.caption,
        type === "button" && styles.button,
        size && textSize[size],
        style,
      ]}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    color: "#000",
    fontFamily: "InstrumentSans_600SemiBold",
  },
  title: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 32,
  },
  body: {
    fontFamily: "InstrumentSans_400Regular",
    fontSize: 16,
  },
  caption: {
    fontFamily: "InstrumentSans_400Regular",
    fontSize: 12,
    color: "#555",
  },
  button: {
    fontFamily: "InstrumentSans_600SemiBold",
    fontSize: 12,
    color: "#000",
  },
});

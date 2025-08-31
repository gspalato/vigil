import { Pressable, StyleSheet, ViewStyle } from "react-native";

type IThemedButtonProps = (
  | { text: never; icon: any }
  | { text: string; icon: never }
  | { text: string; icon: any }
) & {
  style: ViewStyle;
  onPress: () => void;
} & React.PropsWithChildren;

export const ThemedButton: React.FC<IThemedButtonProps> = (props) => {
  const { children, onPress, style } = props;

  return (
    <Pressable onPress={onPress} style={[styles.button, style]}>
      {children}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "blue",
  },
  buttonText: {
    color: "white",
    textAlign: "center",
  },
});

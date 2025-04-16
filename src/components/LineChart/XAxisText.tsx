import { StyleSheet } from "react-native";
import React from "react";
import { Text, useFont } from "@shopify/react-native-skia";

type Props = {
  x: number;
  y: number;
  text: string;
  key: number;
};

const XAxisText = ({ x, y, text }: Props) => {
  const font = useFont(require("../../../assets/Outfit-Regular.ttf"));
  if (!font) return null;
  const fontSize = font.measureText(text);
  return (
    <Text
      text={text}
      color={"black"}
      x={x + 10 - fontSize.width / 2}
      y={y + 10}
      font={font}
    />
  );
};

export default XAxisText;

const styles = StyleSheet.create({});

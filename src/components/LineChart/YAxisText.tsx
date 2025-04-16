import { StyleSheet } from "react-native";
import React from "react";
import { Text, useFont } from "@shopify/react-native-skia";

type Props = {
  x: number;
  y: number;
  text: string;
  key: number;
};

const YAxisText = ({ x, y, text }: Props) => {
  const font = useFont(require("../../../assets/Outfit-Regular.ttf"));
  if (!font) return null;
  const fontSize = font.measureText(text);

  return (
    <Text
      text={text}
      color={"black"}
      x={x} // Posicionado a la izquierda del eje Y
      y={y} // Centrado verticalmente en la posición y
      font={font}
    />
  );
};

export default YAxisText;

const styles = StyleSheet.create({});

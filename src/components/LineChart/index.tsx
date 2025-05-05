import { StyleSheet, Text, View } from "react-native";
import React, { useEffect } from "react";
import { Canvas, Path, Skia } from "@shopify/react-native-skia";
import { curveBasis, line, scaleLinear, scalePoint } from "d3";
import { useSharedValue, withTiming } from "react-native-reanimated";
import XAxisText from "./XAxisText";
import YAxisText from "./YAxisText";
import { useColorScheme } from "react-native";

type Props = {
  data: any[];
  chartHeight: number;
  chartWidth: number;
  chartMargin: number;
};

const LineChart = ({ data, chartHeight, chartWidth, chartMargin }: Props) => {
  const theme = useColorScheme(); // 'light' or 'dark'
  const animationLine = useSharedValue(0);

  useEffect(() => {
    animationLine.value = withTiming(1, { duration: 1500 });
  }, []);

  // --- Validación de datos ---
  if (!data || data.length === 0) {
    return (
        <Canvas
            style={{
              width: chartWidth,
              height: chartHeight + 20,
              backgroundColor: theme === "dark" ? "#121212" : "#ffffff",
            }}
        />
    );
  }

  // --- Escalas ---
  const xDomain = data.map((coord) => coord.x);
  const xRange = [chartMargin, chartWidth - chartMargin];
  const x = scalePoint().domain(xDomain).range(xRange).padding(0.5);

  const yValues = data.map((coord) => coord.y);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  const safeMinY = minY === maxY ? minY - 1 : minY;
  const safeMaxY = minY === maxY ? maxY + 1 : maxY;

  const y = scaleLinear().domain([safeMinY, safeMaxY]).range([chartHeight, 0]);

  // --- Generación de curva SVG ---
  const curvedLine = line<{ x: number; y: number }>()
      .x((d) => x(d.x) ?? 0)
      .y((d) => y(d.y))
      .curve(curveBasis)(data);

  const linePath = curvedLine ? Skia.Path.MakeFromSVGString(curvedLine) : null;

  // --- Etiquetas Y ---
  const interval = (safeMaxY - safeMinY) / 5;
  const yLabels = Array.from({ length: 5 }, (_, i) =>
      (safeMinY + (i + 1) * interval).toFixed(2),
  );

  return (
      <Canvas
          style={{
            width: chartWidth,
            height: chartHeight + 20,
            backgroundColor: theme === "dark" ? "#121212" : "#ffffff",
          }}
      >
        {/* Línea animada */}
        {linePath && (
            <Path
                path={linePath}
                style="stroke"
                strokeWidth={1.2}
                color={theme === "dark" ? "#4FC3F7" : "#3498db"}
                strokeCap="round"
                start={0}
                end={animationLine}
                transform={[{ translateX: 10 }]}
            />
        )}

        {/* Etiquetas X */}
        {data.map((coord, index) => {
          if (index % 200 === 0) {
            return (
                <XAxisText
                    key={`x-${index}`}
                    x={x(coord.x) ?? 0}
                    y={chartHeight + 5}
                    text={coord.x.toFixed(1)}
                />
            );
          }
          return null;
        })}

        {/* Etiquetas Y */}
        {yLabels.map((label, i) => (
            <YAxisText
                key={`y-${i}`}
                x={-1}
                y={y(parseFloat(label))}
                text={label}
            />
        ))}
      </Canvas>
  );
};

export default LineChart;

const styles = StyleSheet.create({});

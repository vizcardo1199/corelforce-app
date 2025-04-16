import { StyleSheet, Text, View } from "react-native";
import React, { useEffect } from "react";
import { Canvas, Path, Skia } from "@shopify/react-native-skia";
import { curveBasis, line, scaleLinear, scalePoint } from "d3";
import { useSharedValue, withTiming } from "react-native-reanimated";
import XAxisText from "./XAxisText";
import YAxisText from "./YAxisText";

type Props = {
  data: any[];
  chartHeight: number;
  chartWidth: number;
  chartMargin: number;
};

const LineChart = ({ data, chartHeight, chartWidth, chartMargin }: Props) => {
  const animationLine = useSharedValue(0);

  useEffect(() => {
    animationLine.value = withTiming(1, { duration: 1500 });
  }, []);

  const xDomain = data.map((coord) => coord.x);

  const xRange = [chartMargin, chartWidth - chartMargin];

  const x = scalePoint().domain(xDomain).range(xRange).padding(0.5);

  const max = Math.max(...data.map((coord) => coord.y));
  const min = Math.min(...data.map((coord) => coord.y));

  const yDomain = [min, max];
  const yRange = [chartHeight, 0];

  const y = scaleLinear().domain(yDomain).range(yRange);

  const curvedLine = line<any>()
    .x((d) => x(d.x)!)
    .y((d) => y(d.y))
    .curve(curveBasis)(data);

  const linePath = Skia.Path.MakeFromSVGString(curvedLine!);

  const maxY = Math.max(...data.map((coord) => coord.y));
  const minY = Math.min(...data.map((coord) => coord.y));
  const interval = (maxY - minY) / 5;
  const yLabels = Array.from({ length: 6 }, (_, i) =>
    (minY + i * interval).toFixed(2),
  );
  // remove first
  yLabels.shift();

  return (
    <Canvas
      style={{
        width: chartWidth,
        height: chartHeight + 20,
        backgroundColor: "white",
      }}
    >
      <Path
        path={linePath!}
        style={"stroke"}
        strokeWidth={0.7}
        color="#3498db"
        strokeCap={"round"}
        start={0}
        end={animationLine}
        transform={[{ translateX: 10 }]}
      />

      {data.map((coord, index) => {
        if (index % 200 == 0) {
          return (
            <XAxisText
              x={x(coord.x)!}
              y={chartHeight + 5}
              text={(Math.round(((coord.x * 1) / 1) * 10) / 10) .toString()}
              key={index}
            />
          );
        }
      })}
      {yLabels.map((label, i) => (
        <YAxisText key={i} x={-1} y={y(parseFloat(label))} text={label} />
      ))}
    </Canvas>
  );
};

export default LineChart;

const styles = StyleSheet.create({});

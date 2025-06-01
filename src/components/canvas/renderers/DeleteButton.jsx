import { Group, Circle, Text as KonvaText } from "react-konva";

export const DeleteButton = ({ x, y, onClick }) => (
  <Group x={x} y={y}>
    <Circle
      radius={15}
      fill="rgba(255, 0, 0, 0.7)"
      stroke="white"
      strokeWidth={2}
      onClick={onClick}
      onTap={onClick}
    />
    <KonvaText
      text="✕"
      fontSize={16}
      fill="white"
      align="center"
      verticalAlign="middle"
      x={-5}
      y={-8}
      onClick={onClick}
      onTap={onClick}
    />
  </Group>
);

import React from "react";
import { Text as KonvaText } from "react-konva";
import { DeleteButton } from "./DeleteButton.jsx";

export const TextRenderer = ({ element, behaviors, isSelected, onDelete }) => (
  <React.Fragment key={element.id}>
    <KonvaText
      id={element.id}
      x={element.x}
      y={element.y}
      text={element.text}
      fontSize={element.fontSize}
      fontFamily={element.fontFamily}
      fill={element.fill}
      width={element.width}
      rotation={element.rotation}
      draggable={element.draggable}
      onMouseEnter={behaviors.handleElementMouseEnter()}
      onMouseLeave={behaviors.handleElementMouseLeave()}
      onDragStart={behaviors.handleElementDragStart(element)}
      onDragEnd={behaviors.handleElementDragEnd(element)}
      onClick={behaviors.handleElementClick(element)}
    />
    {isSelected && (
      <DeleteButton
        x={element.x + element.width - 10}
        y={element.y - 15}
        onClick={() => onDelete(element)}
      />
    )}
  </React.Fragment>
);

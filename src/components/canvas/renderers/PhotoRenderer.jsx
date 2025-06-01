import React from "react";
import { Image as KonvaImage } from "react-konva";
import { DeleteButton } from "./DeleteButton.jsx";

export const PhotoRenderer = ({ element, behaviors, isSelected, onDelete }) => (
  <React.Fragment key={element.id}>
    <KonvaImage
      id={element.id}
      image={element.image}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
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

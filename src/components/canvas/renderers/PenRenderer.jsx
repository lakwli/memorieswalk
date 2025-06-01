import React from "react";
import { Line } from "react-konva";
import { DeleteButton } from "./DeleteButton.jsx";

export const PenRenderer = ({ element, behaviors, isSelected, onDelete }) => (
  <React.Fragment key={element.id}>
    <Line
      id={element.id}
      points={element.points}
      stroke={element.strokeColor}
      strokeWidth={element.strokeWidth}
      tension={element.tension}
      closed={element.closed}
      draggable={element.draggable}
      onMouseEnter={behaviors.handleElementMouseEnter()}
      onMouseLeave={behaviors.handleElementMouseLeave()}
      onDragStart={behaviors.handleElementDragStart(element)}
      onDragEnd={behaviors.handleElementDragEnd(element)}
      onClick={behaviors.handleElementClick(element)}
    />
    {isSelected && (
      <DeleteButton
        x={element.getBounds().x + element.getBounds().width - 10}
        y={element.getBounds().y - 15}
        onClick={() => onDelete(element)}
      />
    )}
  </React.Fragment>
);

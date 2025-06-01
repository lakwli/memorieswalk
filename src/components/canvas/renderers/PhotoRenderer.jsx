import React from "react";
import PropTypes from "prop-types";
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

PhotoRenderer.propTypes = {
  element: PropTypes.shape({
    id: PropTypes.string.isRequired,
    image: PropTypes.object,
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    rotation: PropTypes.number,
    draggable: PropTypes.bool,
  }).isRequired,
  behaviors: PropTypes.shape({
    handleElementMouseEnter: PropTypes.func.isRequired,
    handleElementMouseLeave: PropTypes.func.isRequired,
    handleElementDragStart: PropTypes.func.isRequired,
    handleElementDragEnd: PropTypes.func.isRequired,
    handleElementClick: PropTypes.func.isRequired,
  }).isRequired,
  isSelected: PropTypes.bool.isRequired,
  onDelete: PropTypes.func.isRequired,
};

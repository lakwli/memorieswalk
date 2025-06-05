import React from "react";
import PropTypes from "prop-types";
import { Image as KonvaImage } from "react-konva";

export const PhotoRenderer = ({
  element,
  behaviors,
  isBeingEdited = false,
  onEditStart,
  onEditEnd,
}) => {
  // Handle double-click to enter editing mode
  const handlePhotoDblClick = () => {
    if (isBeingEdited) return;

    // Notify parent that editing has started
    if (onEditStart) {
      onEditStart();
    }
  };

  return (
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
        onDblClick={handlePhotoDblClick}
      />
    </React.Fragment>
  );
};

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
  isBeingEdited: PropTypes.bool,
  onEditStart: PropTypes.func,
  onEditEnd: PropTypes.func,
};

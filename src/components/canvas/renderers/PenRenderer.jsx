import React from "react";
import PropTypes from "prop-types";
import { Line } from "react-konva";

export const PenRenderer = ({ element, behaviors }) => (
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
  </React.Fragment>
);

PenRenderer.propTypes = {
  element: PropTypes.shape({
    id: PropTypes.string.isRequired,
    points: PropTypes.arrayOf(PropTypes.number).isRequired,
    strokeColor: PropTypes.string.isRequired,
    strokeWidth: PropTypes.number.isRequired,
    tension: PropTypes.number,
    closed: PropTypes.bool,
    draggable: PropTypes.bool,
    getBounds: PropTypes.func.isRequired,
  }).isRequired,
  behaviors: PropTypes.shape({
    handleElementMouseEnter: PropTypes.func.isRequired,
    handleElementMouseLeave: PropTypes.func.isRequired,
    handleElementDragStart: PropTypes.func.isRequired,
    handleElementDragEnd: PropTypes.func.isRequired,
    handleElementClick: PropTypes.func.isRequired,
  }).isRequired,
};

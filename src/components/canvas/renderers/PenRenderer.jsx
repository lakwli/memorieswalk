import PropTypes from "prop-types";
import { Line } from "react-konva";
import { BaseRenderer } from "./BaseRenderer.jsx";

class PenRendererClass extends BaseRenderer {
  constructor(props) {
    super(props);
  }

  renderContent() {
    return (
      <Line
        {...this.elementProps}
        points={this.element.points}
        stroke={this.element.strokeColor}
        strokeWidth={this.element.strokeWidth}
        tension={this.element.tension}
        closed={this.element.closed}
      />
    );
  }
}

export const PenRenderer = (props) => {
  const renderer = new PenRendererClass(props);
  return renderer.render();
};

// Only define pen-specific PropTypes, inherit base from parent
PenRenderer.propTypes = {
  ...BaseRenderer.basePropTypes,
  element: PropTypes.shape({
    ...BaseRenderer.basePropTypes.element,
    points: PropTypes.arrayOf(PropTypes.number).isRequired,
    strokeColor: PropTypes.string.isRequired,
    strokeWidth: PropTypes.number.isRequired,
    tension: PropTypes.number,
    closed: PropTypes.bool,
  }).isRequired,
};

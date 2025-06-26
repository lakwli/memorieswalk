import PropTypes from "prop-types";
import { Image as KonvaImage } from "react-konva";
import { BaseRenderer } from "./BaseRenderer.jsx";

class PhotoRendererClass extends BaseRenderer {
  constructor(props) {
    super(props);
  }

  renderContent() {
    return (
      <KonvaImage
        image={this.element.image}
        width={this.element.width}
        height={this.element.height}
        // ✅ NO x, y props - let BaseRenderer's Group handle positioning
        // ✅ Add other specific props if needed (opacity, filters, etc.)
      />
    );
  }
}

export const PhotoRenderer = (props) => {
  const renderer = new PhotoRendererClass(props);
  return renderer.render();
};

// Only define photo-specific PropTypes, inherit base from parent
PhotoRenderer.propTypes = {
  ...BaseRenderer.basePropTypes,
  element: PropTypes.shape({
    ...BaseRenderer.basePropTypes.element,
    image: PropTypes.object,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
  }).isRequired,
};

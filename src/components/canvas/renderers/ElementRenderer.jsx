import PropTypes from "prop-types";
import { ELEMENT_TYPES } from "../../../constants/elementTypes.js";
import { PhotoRenderer } from "./PhotoRenderer.jsx";
import { TextRenderer } from "./TextRenderer.jsx";
import { PenRenderer } from "./PenRenderer.jsx";

export const ElementRenderer = ({
  element,
  behaviors,
  isSelected,
  onDelete,
  onUpdate,
}) => {
  switch (element.type) {
    case ELEMENT_TYPES.PHOTO:
      return (
        <PhotoRenderer
          element={element}
          behaviors={behaviors}
          isSelected={isSelected}
          onDelete={onDelete}
          onUpdate={onUpdate}
        />
      );
    case ELEMENT_TYPES.TEXT:
      return (
        <TextRenderer
          element={element}
          behaviors={behaviors}
          isSelected={isSelected}
          onDelete={onDelete}
          onUpdate={onUpdate}
        />
      );
    case ELEMENT_TYPES.PEN:
      return (
        <PenRenderer
          element={element}
          behaviors={behaviors}
          isSelected={isSelected}
          onDelete={onDelete}
          onUpdate={onUpdate}
        />
      );
    default:
      return null;
  }
};

ElementRenderer.propTypes = {
  element: PropTypes.shape({
    type: PropTypes.string.isRequired,
  }).isRequired,
  behaviors: PropTypes.object.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onDelete: PropTypes.func.isRequired,
};

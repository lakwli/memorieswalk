import PropTypes from "prop-types";
import { ELEMENT_TYPES } from "../../../constants/elementTypes.js";
import { PhotoRenderer } from "./PhotoRenderer.jsx";
import { TextRenderer } from "./TextRenderer.jsx";
import { PenRenderer } from "./PenRenderer.jsx";

export const ElementRenderer = ({
  element,
  behaviors,
  onUpdate,
  onEditStart,
  onEditEnd,
  isBeingEdited,
}) => {
  switch (element.type) {
    case ELEMENT_TYPES.PHOTO:
      return (
        <PhotoRenderer
          element={element}
          behaviors={behaviors}
          onUpdate={onUpdate}
          onEditStart={onEditStart}
          onEditEnd={onEditEnd}
          isBeingEdited={isBeingEdited}
        />
      );
    case ELEMENT_TYPES.TEXT:
      return (
        <TextRenderer
          element={element}
          behaviors={behaviors}
          onUpdate={onUpdate}
          onEditStart={onEditStart}
          onEditEnd={onEditEnd}
          isBeingEdited={isBeingEdited}
        />
      );
    case ELEMENT_TYPES.PEN:
      return (
        <PenRenderer
          element={element}
          behaviors={behaviors}
          onUpdate={onUpdate}
          isBeingEdited={isBeingEdited}
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
  onUpdate: PropTypes.func,
  onEditStart: PropTypes.func,
  onEditEnd: PropTypes.func,
  isBeingEdited: PropTypes.bool,
};

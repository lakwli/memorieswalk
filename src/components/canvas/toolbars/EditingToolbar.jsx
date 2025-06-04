import PropTypes from "prop-types";
import { TextEditingToolbar } from "./TextEditingToolbar.jsx";
import { PhotoEditingToolbar } from "./PhotoEditingToolbar.jsx";
import { ShapeEditingToolbar } from "./ShapeEditingToolbar.jsx";

/**
 * EditingToolbar - Toolbar shown when element is being edited (double-click)
 * 
 * Routes to appropriate editing toolbar based on element type
 */
export const EditingToolbar = ({ element, onUpdate, onFinishEditing }) => {
  switch (element.type) {
    case "text":
      return (
        <TextEditingToolbar
          element={element}
          onUpdate={onUpdate}
          onFinishEditing={onFinishEditing}
        />
      );
    case "photo":
      return (
        <PhotoEditingToolbar
          element={element}
          onUpdate={onUpdate}
          onFinishEditing={onFinishEditing}
        />
      );
    case "pen":
    case "shape":
      return (
        <ShapeEditingToolbar
          element={element}
          onUpdate={onUpdate}
          onFinishEditing={onFinishEditing}
        />
      );
    default:
      return null;
  }
};

EditingToolbar.propTypes = {
  element: PropTypes.shape({
    type: PropTypes.string.isRequired,
  }).isRequired,
  onUpdate: PropTypes.func.isRequired,
  onFinishEditing: PropTypes.func.isRequired,
};

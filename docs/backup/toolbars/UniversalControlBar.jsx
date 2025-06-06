import PropTypes from "prop-types";
import { HStack } from "@chakra-ui/react";
import { CONTROL_REGISTRY } from "./controls/index.js";

/**
 * UniversalControlBar
 * Renders a set of controls by control key (e.g. ['fontStyle', 'delete'])
 * Controls are stateless and element-agnostic
 *
 * Usage example:
 *   import { TOOLBAR_CONFIG } from './toolbarConfig';
 *   const controls = TOOLBAR_CONFIG[mode][element.type];
 *   <UniversalControlBar controls={controls} controlProps={{ element, onUpdate, ... }} />
 */
export const UniversalControlBar = ({
  controls,
  controlProps,
  controlRegistry = CONTROL_REGISTRY,
}) => (
  <HStack spacing={1}>
    {controls.map((key) => {
      const Control = controlRegistry[key];
      return Control ? <Control key={key} {...controlProps} /> : null;
    })}
  </HStack>
);

UniversalControlBar.propTypes = {
  controls: PropTypes.arrayOf(PropTypes.string).isRequired,
  controlProps: PropTypes.object,
  controlRegistry: PropTypes.object,
};

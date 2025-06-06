// Central registry for all stateless, element-agnostic controls
// Example: import and export all controls here
// import { FontStyleControl } from './FontStyleControl';
// import { FontSizeControl } from './FontSizeControl';
// import { AlignmentControl } from './AlignmentControl';
// import { BrightnessControl } from './BrightnessControl';
// import { DeleteButton } from './DeleteButton';
// import { SendToBackButton } from './SendToBackButton';
// import { SendToFrontButton } from './SendToFrontButton';
// ...

import {
  FontFamilyControl,
  FontSizeControl,
  TextColorControl,
  AlignLeftControl,
  AlignCenterControl,
  AlignRightControl,
  BackgroundShapeControl,
  BrightnessControl,
  ContrastControl,
  StrokeWidthControl,
  StrokeColorControl,
  EditControl,
  CopyControl,
  BringForwardControl,
  SendBackwardControl,
  BringToFrontControl,
  SendToBackControl,
  DeleteControl,
  DoneControl,
} from "./UniversalToolbarControls.jsx";

export const CONTROL_REGISTRY = {
  fontFamily: FontFamilyControl,
  fontSize: FontSizeControl,
  textColor: TextColorControl,
  alignLeft: AlignLeftControl,
  alignCenter: AlignCenterControl,
  alignRight: AlignRightControl,
  backgroundShape: BackgroundShapeControl,
  brightness: BrightnessControl,
  contrast: ContrastControl,
  strokeWidth: StrokeWidthControl,
  strokeColor: StrokeColorControl,
  edit: EditControl,
  copy: CopyControl,
  bringForward: BringForwardControl,
  sendBackward: SendBackwardControl,
  bringToFront: BringToFrontControl,
  sendToBack: SendToBackControl,
  delete: DeleteControl,
  done: DoneControl,
};

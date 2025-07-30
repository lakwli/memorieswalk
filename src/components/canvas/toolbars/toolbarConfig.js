// Centralized toolbar configuration for select/edit toolbars
// Each entry is an array of control keys (strings)
//contros are decided in ElementToolbarControls.GlobalSelectControl
/** 
export const GLOBAL_SELECT_CONTROLS = [
  //"copy",
  "bringForward",
  "sendBackward",
  //"bringToFront",
  //"sendToBack",
  "delete",
];
*/
export const TOOLBAR_CONFIG = {
  select: {
    text: [
      "fontFamily",
      "fontSize",
      "textColor",
      //"alignLeft",
      "alignCenter",
      //"alignRight",
      "backgroundShape",
      "globalSelect",
    ],
    photo: ["brightness", "contrast", "globalSelect"],
    shape: ["strokeWidth", "strokeColor", "globalSelect"],
    // Add more element types as needed
  },
  edit: {
    text: ["fontFamily", "fontSize", "textColor"],
    photo: ["brightness", "contrast"],
    shape: ["strokeWidth", "strokeColor"],
    // Add more element types as needed
  },
};

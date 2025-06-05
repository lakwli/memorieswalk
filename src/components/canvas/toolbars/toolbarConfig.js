// Centralized toolbar configuration for select/edit toolbars
// Each entry is an array of control keys (strings)

export const GLOBAL_SELECT_CONTROLS = [
  "copy",
  "bringForward",
  "sendBackward",
  "bringToFront",
  "sendToBack",
  "delete",
];

export const TOOLBAR_CONFIG = {
  select: {
    textbox: [...GLOBAL_SELECT_CONTROLS],
    photo: [...GLOBAL_SELECT_CONTROLS],
    shape: [...GLOBAL_SELECT_CONTROLS],
    // Add more element types as needed
  },
  edit: {
    textbox: [
      "fontFamily",
      "fontSize",
      "textColor",
      "alignLeft",
      "alignCenter",
      "alignRight",
      "backgroundShape",
      "delete",
    ],
    photo: ["brightness", "contrast", "delete"],
    shape: ["strokeWidth", "strokeColor", "delete"],
    // Add more element types as needed
  },
};

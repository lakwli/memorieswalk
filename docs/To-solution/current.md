#1: For textbox, if i select a textbox and if i click on pen button, the editoolbar (e.g. change font style) appear while the textbox remain shown as 'display' with no resize&rotate around.If i change the font style, the toolbox disappear, the text font style is changed, (Solved, the toolbar remain)
#2: For textbox, when i double click, it is edit mode with the text highlight and dashborder for the textbox with white background. the toolbar show the editingtoobar. but when i change fontstyle, the toolbar disappear, then nothing happen. The element itself lost focus and back to 'display' with no resize&rotate around. (not in select nor edit mode)

#3: For photo, if select a photo, ii click on pen button, the editoolbar (e.g. with control brightness) appear while the photo remain shown as 'display' with no resize&rotate around. If i change the brightness style, the toolbox disappear, the photo have nothing changed (probably the implementation is not there yet). (Solved, the toolbar remain)
#4: If i double click the photo, it is still remain the same as when i select the photo with the selecttoolbar shown with resize&rotate around.

#5:I also noticed that, when i select the element (be it photo or textbox), when i chose the delete from the toolbar, same thing happen that the toolbar disappear and the element itself lost focus. there is no log from server, vite, nor from browser console. Delete not happen as the element still remain in the canvas. (Solve)

there is another problem apply to photo as well. if you click on edit, the transform control is disappear (which is correct, apply the same to textbox as well), and if i try to change brightness (similar to if you change font style to textbox, it is however the textbox in this case doesn't show the the same as double click), once you release your mouse, the toolbar disappear, and nothing happen. it should be common behavior on how the toolbar control can reflect correponding element. There is architectural design to manage the common and specific so that what is common should have generic code apply to them to have consistent behavior while what is specific would be control by child class. it is however, currently it is separate class, e..g. useElementBehavior manage the elements which a lot of common logic happen in these class rather than child class. based on the architectural which i have already include here, to investigate what could be the problem. we need to find out the root cause before making any changes.

## Current Architectural:

### Refer to

/workspace/docs/To-solution/done/ELEMENT_SYSTEM_SUMMARY.md
/workspace/src/components/canvas
//workspace/src/hooks
/workspace/src/pages/MemoryEditorPage.jsx

### The architecture is based on a clear separation:

- Use a **centralized state store** (React context, Zustand, Redux) to manage elements, groups, and selection.
- **Element classes** (e.g., TextElement, PhotoElement) are pure data/logic, not React components.
- **Renderers** (e.g., TextRenderer.jsx, PhotoRenderer.jsx) are React components responsible for rendering and UI behaviors. Renderers are stateless except for ephemeral UI state
- **ElementRenderer.jsx** is the universal renderer that delegates to the correct renderer based on element type.
- **State management** (selection, editing, etc.) is handled at the React component level, typically in the page or a coordinating component, NOT in the element classes.

## AI Question:

## Architetural approach first:

act as architect, please advise how should we proper design it to cater for the common behavior between the toolbar and element. this include the toolbar position (already handle perfectly, nothing to fix), toolbar changes upon click on element or double click on element (already handle perfectly, nothing to fix), single clikc on element with respective element toolbar shown in selectToolbar while for double click on element with respective element toolbar shown in editingtoolbar (handle perfectly, nothing to fix).
It is however, upon double click on element with the editing toolbar, or single click on the selecttoolbar to bring to edit, any change apply from the editing toolbar, e.g. change contrast for photo element OR change font style for text, the toolbar disappear and nothing is changed.
From architectural point of view, this editing mode should be manage centrally, either from the base class, or another class manage overall element, for the generic behavior. This should also apply to the toolbox should be stay there until user exit the edit mode (either click on 'Done', or click on another element, or click on empty canvas space). the element will reflect the changes on the fly with its state management with respective element control.
Please act as architect, to propose changes to cater for the what could be the issue of change contrast or font style, result the toolbar disappear while there is no changes on the element, while keep the architectural in mind if there is some changes should apply to fit for the architectural pricinple: no repeate code, separate of concern, separate of common and specific handling, and simplify without over enginnering.
/workspace/docs/To-solution/arch_element_change.md

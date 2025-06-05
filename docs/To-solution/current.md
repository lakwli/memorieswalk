For textbox,when i double click, it is edit mode. the toolbar show the editingtoobar. but when i change fontstyle, the toolbar disappear, then nothing happen

there is another problem apply to photo as well. if you click on edit, the transform control is disappear (which is correct, apply the same to textbox as well), and if i try to change brightness (similar to if you change font style to textbox, it is however the textbox in this case doesn't show the the same as double click), once you release your mouse, the toolbar disappear, and nothing happen. it should be common behavior on how the toolbar control can reflect correponding element. There is architectural design to manage the common and specific so that what is common should have generic code apply to them to have consistent behavior while what is specific would be control by child class. it is however, currently it is separate class, e..g. useElementBehavior manage the elements which a lot of common logic happen in these class rather than child class. based on the architectural which i have already include here, to investigate what could be the problem. we need to find out the root cause before making any changes.

## Current Architectural:

### Refer to

/workspace/docs/To-solution/done/ELEMENT_SYSTEM_SUMMARY.md
/workspace/src/components/canvas

### The architecture is based on a clear separation:

- Use a **centralized state store** (React context, Zustand, Redux) to manage elements, groups, and selection.
- **Element classes** (e.g., TextElement, PhotoElement) are pure data/logic, not React components.
- **Renderers** (e.g., TextRenderer.jsx, PhotoRenderer.jsx) are React components responsible for rendering and UI behaviors. Renderers are stateless except for ephemeral UI state
- **ElementRenderer.jsx** is the universal renderer that delegates to the correct renderer based on element type.
- **State management** (selection, editing, etc.) is handled at the React component level, typically in the page or a coordinating component, NOT in the element classes.

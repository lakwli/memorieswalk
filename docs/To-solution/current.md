#2: For textbox, when i double click, it is edit mode with the text highlight and show the textbox with white background. the toolbar show the editingtoobar. There are expected and correct. But when i change fontstyle, the toolbar disappear, then nothing happen. The element itself lost focus (not in select nor edit mode)

#4: If i double click the photo, it is still remain the same as when i select the photo with the selecttoolbar shown with resize&rotate around.

## What have been done:

### Architectural Changed:

Refer to /workspace/docs/To-solution/arch_element_change.md

### What was fixed:

#1: For textbox, if i select a textbox and if i click on pen button, the editoolbar (e.g. change font style) appear while the textbox remain shown as 'display' with no resize&rotate around.If i change the font style, the toolbox disappear, the text font style is changed, (Solved, the toolbar remain)

#3: For photo, if select a photo, ii click on pen button, the editoolbar (e.g. with control brightness) appear while the photo remain shown as 'display' with no resize&rotate around. If i change the brightness style, the toolbox disappear, the photo have nothing changed (probably the implementation is not there yet). (Solved, the toolbar remain)

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

### Architectural Principle:

what should be common should be common, what should be specific should be specific. the control of toolbar select or ediitng, is common. To control the toolbar dispaly or not, or stay or exit, it is common. the element, to be in select or edit mode, is common. What is specific is, what control to be in the toolbar, and when the user change any control in the toolbar, it will update the state of selected element where this element will reflect it with how it render.

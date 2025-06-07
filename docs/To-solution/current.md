# Problem

## Problem 1: Element/Toolbar Exit uppon click on any control in the toolbar

After i double click on an element to go into edit mode, when i click on any control from the toolbar, e.g. font family drop down, The dropdown opens and immediately closes without giving a chance to select anything, toolbar and element will switch to select mode and then exit (toolbar disappear, element de-select, lost focus), in flash second.

If i single click on an element to go into select mode, when i click on any control from the toolbar, element will exit (toolbar disappear, element de-select, lost focus), in flash second.

it could be NOTHING TO DO with the editing mode. It could be DUE TO rerender, which is result from whole canvas/element state been updated (e.g. update the whole element, or update the whoel canvas).
It could be the issue of how the property been update, which control the re-render of impacted screen part. When click on a control, e.g. font, the selecting/editing element property value should get updated and then result re-render reflect the new changes. But other non-related state should not get updated (to prevent 'exit' happen)

Please investigate. Please think from proper state management and control based on current archtiectural.

### Test:

movement of photo and textbox still working
pan still working

## What is expected:

the toolbar should remain persistent during both selection and editing modes, but with different control sets:

### Single Click (Selection Mode)

Show: Font style, font size, alignment + common controls (send to back, delete, etc.)
Allow: Resize, rotate, move operations
Toolbar stays visible until user deselects

### Double Click (Edit Mode)

Show: Enhanced text editing controls (font style, font size, alignment, bold, italic, underline, text color, etc.)
Hide: Common selection controls (send to back, delete, resize handles)
Disable: Resize, rotate, move operations
Toolbar stays visible during entire editing session

### Conditions

toolbar should disappear when:

User clicks on empty canvas
User selects a different element
User presses ESC key
User clicks outside the canvas area

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

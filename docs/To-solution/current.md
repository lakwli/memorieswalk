# Problem

#2: For textbox, when i double click, it is edit mode with the text highlight and show the textbox with white background. the toolbar show the editingtoobar. There are expected and correct. But when i change fontstyle, the toolbar disappear, then nothing happen. The element itself lost focus (not in select nor edit mode)

#4: If i double click the photo, it is still remain the same as when i select the photo with the selecttoolbar shown with resize&rotate around.

I noticed that,
For photo, after i select a photo, the selecttoobar display, if i click on edit, it show editingtoolbar,the photo remain as 'display' with the transform control disappear. when i drag the progress bar the editingtoolbar still persist. the photo doesn't change as the i drag as the reflection is not implmenet yet. Until i click on Done (back to selecttoolbar with the photo selected) or click somewhere else (toolbar disappear and photo is deselect) .
If i double click the photo, the behavior is the same as click on edit button after select the element.
Above are expected.

For textbox, is different behavior. when i select textbox, the selecttoobar display, if i click on edit, it show editingtoolbar, the textbox remain as 'display' (not editble) with the transform control disappear. when i select font style the editingtoolbar still persist. The text font change based on my selected font style. Until i click on Done (back to selecttoolbar with the textbox selected) or click somewhere else (toolbar disappear and textbox is deselect). this is same as the photo. This is expected.
BUT if i double click on textbox, it show editingtoolbar, it shown text as editable that i can change the text with the transform control disappear. So far are expected. But when i change the fontstyle, the editing toolbar disappear and the textbox become de-selected. If i don't change font style but click on Done it will back to selecttoolbar (expected) but the textbox is de-selected (different from previous 3 behavior) or click somewhere else (toolbar disappear and textbox is deselect) which is expected.

# What to Change

## Expectation:

The SelectedToolbar should always include both universal actions (edit, layer, copy, delete) and a compact set of element-specific controls for fast, direct adjustments. This provides a smoother, more intuitive user experience and matches user expectations from other design/canvas tools.

The toolbar (EditingToolbar) should remain visible and editing state should persist until the user explicitly exits (Done or click away), regardless of how you entered edit mode (select or double-click).

### SelectedToolbar: Universal + Element-Specific Controls

##### When an element is selected:

The element is in "select" mode.
Transformation controls (resize, rotate, move) are visible and active.
The user can quickly adjust common properties via compact controls in the toolbar.
The element itself is not deeply editable (e.g., text is not directly editable, just styled).

#### Universal Controls (all elements):

Edit (pen) button
Layer controls (bring forward/backward)
Copy/Duplicate
Delete
More menu (advanced actions)

#### Element-Specific Controls (compact, always visible in SelectedToolbar):

Text: Font family, font size, color, alignment (as dropdowns/buttons)
Photo: Quick filter, brightness/contrast sliders, crop/fit toggle
Shape: Fill color, stroke color, border width
Behavior:

#### Behavior:

These controls are immediately actionable—changing a property updates the element without entering deep edit mode.
The UI for these controls should be compact (icon buttons, dropdowns, sliders) and visually grouped before the universal controls.

### EditingToolbar: Deep Editing (Persistent Until Explicit Exit)

#### Entered via Edit button or double-click.

The element is in "edit" mode.
Transformation controls (resize, rotate, move) are hidden/disabled.
The element itself becomes deeply editable (e.g., textbox allows direct text editing, photo allows advanced adjustments).
The toolbar shows full, detailed controls for deep editing.
The user cannot move/resize/rotate the element until they exit edit mode (Done or click away).
The toolbar remains visible and editing state persists until the user explicitly exits.
All property changes in this mode are live and do not exit edit mode.

### Implementation Steps

Refactor SelectedToolbar to accept and render a set of element-specific controls based on the selected element type.
Use a pattern like:
SelectedToolbar = [Element-Specific Quick Controls] + [Universal Controls]
EditingToolbar = [Full Controls, persistent until explicit exit]
Create small, stateless "quick controls" components for each element type (e.g., TextQuickControls, PhotoQuickControls).
Ensure all property changes from these controls update the element immediately, without changing the selection or entering edit mode.
EditingToolbar logic remains as is, but ensure it is only exited by explicit user action.

### UX Result

Users can make fast, common adjustments directly from selection.
Deep editing is available but not required for every change.
The toolbar experience is consistent, efficient, and matches user expectations from modern design tools.

### Summary:

SelectedToolbar = [Element-Specific Quick Controls] + [Universal Controls]
EditingToolbar = [Full Controls, persistent until explicit exit]

This approach is modern, user-friendly, and fully matches your architectural principles.

# What is Current:

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

UniversalControl:
C1, C2, C3, C4, C5, C6, C7, C8, C9, C10, C11

GlobalSelectToolbar: C5,C6,C7
TextboxSelectToolbar: C1, C2 , C3, {GlobalSelectToolbar}
PhotoSelectToolbar: C4, C5 {GlobalSelectToolbar}

TextboxEditToolbar: C1, C2, C3, C8, C9
PhotoEditToolbar: C4, C5, C10, C11

Example:
GlobalSelectToolbar example: delete, send to back, send to front
TextboxEditToolbar: font style, font size, alignment
PhotoEditToolbar: brighness, contract, transparent

note:
GlobalSelectToolbar should be manage at cross element level as it is generic

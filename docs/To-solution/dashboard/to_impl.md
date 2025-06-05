Based on your description and the architectural guidelines in elementDesign.md, here’s a root cause analysis for the issues with photo and textbox editing toolbars, overlays, and editing state:

1. Problem Recap
   When editing a photo (e.g., adjusting brightness), the toolbar disappears after interaction, and the edit is not applied.
   For textboxes, similar issues occur: after a style change, the editing overlay/toolbar can disappear or become out of sync.
   The transform controls correctly disappear during editing, but the editing state/toolbars are not consistently managed.
   The code for managing editing state and toolbar visibility is not generic—common logic is in parent or shared hooks, but element-specific logic is scattered or duplicated.
2. Architectural Expectation
   From elementDesign.md:

Editing state, selection, and toolbar visibility should be managed centrally and generically.
All elements (photo, textbox, etc.) should share common editing behaviors, with specific logic handled in child components/classes.
Toolbars should be composable and reactive, updating automatically on selection or editing state changes. 3. Root Cause Analysis
A. Editing State Management
The editing state (e.g., which element is being edited, and what mode) is likely managed in a parent component (e.g., MemoryEditorPage.jsx) and/or a shared hook (e.g., useElementBehaviors).
When a style property is changed (e.g., brightness for photo, font for textbox), the element is updated, but the editing state is not always preserved or updated in sync.
This causes the toolbar and overlays to disappear, as the app thinks editing has ended or the selection has changed.
B. Lack of Generic Editing Logic
The logic for maintaining editing state and toolbar visibility is not abstracted into a generic layer.
Instead, each element type (photo, textbox) may have its own local state or ad-hoc logic, leading to inconsistencies.
For example, TextRenderer.jsx uses local state for its overlay, which can become out of sync with the global editing state.
C. Toolbar/Overlay Rendering
Toolbars and overlays are rendered based on the editing state.
If the editing state is lost or not updated when an element is changed, the toolbar/overlay disappears.
The transform controls are correctly hidden during editing, but the editing toolbar should remain visible and reactive to style changes.
D. useElementBehaviors and Related Hooks
Common logic for element behaviors (move, resize, edit, etc.) is in useElementBehaviors, but it may not be sufficiently generic or prop-driven.
Child components (e.g., photo, textbox) should receive editing state and update callbacks as props, not manage their own local state. 4. Summary of Root Cause
The main issue is that editing state and toolbar visibility are not managed in a generic, prop-driven way.
When an element is updated (e.g., style change), the editing state is not preserved or updated, causing toolbars/overlays to disappear.
The architecture does not fully separate common editing logic (in a generic layer) from element-specific logic (in child components), leading to duplicated or inconsistent behavior.
Next step:
To fix this, the editing state and toolbar visibility logic should be refactored to be generic and centralized, with child components receiving editing state and update callbacks as props. This will ensure consistent, live-updating toolbars and overlays for all element types.

## Correct Architectural Understanding

Element classes: Pure data, no React state/UI.
Renderers: React components, stateless except for local UI state (e.g., input value), receive all state via props.
ElementRenderer.jsx: Universal dispatcher, receives props from parent (e.g., selection, editing state, update callbacks).
MemoryEditorPage.jsx (or similar): The true "parent" for editing/selection state, passes down all state and handlers as props to renderers/toolbars.
All editing/selection state must be managed in the page or a top-level React component, not in element classes or deep in the renderer tree.

### What This Means for the Refactor

Editing state (which element is being edited, etc.) is managed in the page (e.g., MemoryEditorPage.jsx).
Renderers (e.g., TextRenderer.jsx) receive isEditing, onEditStart, onEditEnd, etc. as props.
No local editing state in renderers except for ephemeral UI (e.g., input value).
Toolbars/overlays are shown/hidden based on prop-driven state from the parent/page.
ElementRenderer.jsx is the only place that switches on element type and delegates to the correct renderer.

## to plan:

Refactor Plan (Corrected)

1. Centralize Editing State in the Page/Coordinator
   The page (e.g., MemoryEditorPage.jsx) is the single source of truth for selection and editing state.
   It passes isEditing, onEditStart, onEditEnd, etc. as props to ElementRenderer.
2. Prop-Driven Renderers
   All renderers (text, photo, etc.) receive editing state and handlers as props.
   Remove any local editing state for overlays/toolbars from renderers.
3. Universal ElementRenderer
   ElementRenderer.jsx receives all state/handlers as props and delegates to the correct renderer.
4. Toolbars/Overlays
   Toolbars/overlays are rendered based on prop-driven state, never local state.
5. Live Updates
   When a style property is changed, the page updates both the element and the editing state, so overlays/toolbars remain visible and editing continues.
   Next Steps
   Refactor TextRenderer.jsx and other renderers to remove local editing state for overlays/toolbars.
   Ensure all editing/selection state is managed in the page and passed down as props.
   Update ElementRenderer.jsx to pass the correct props to each renderer.
   Ensure toolbars/overlays are always in sync with the editing state from the parent.

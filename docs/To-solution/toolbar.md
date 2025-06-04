# Element Toolbar Architecture Requirements

## Overview

This document defines the requirements for implementing a two-tier toolbar system for canvas elements in the memory sharing application. The system provides contextual toolbars that adapt based on user interaction state and element type.

## Architecture Goals

- **Consistent positioning** across all element types
- **State-aware toolbars** that change based on user interaction mode
- **Element-specific tools** while maintaining common patterns
- **Professional design tool UX** matching industry standards (Figma, Adobe, eDraw)
- **Scalable system** that easily supports new element types

## Two-Tier System

### Tier 1: SelectedToolbar (Selection State)

**Trigger**: Single click on any canvas element
**Purpose**: Quick style preview + object management + layer operations
**Transform Controls**: Visible (rotation handles, resize handles)
**User Intent**: Position, scale, rotate, or perform quick style changes

### Tier 2: EditingToolbar (Edit State)

**Trigger**: Double click on element or explicit edit action
**Purpose**: Deep content editing with specialized tools
**Transform Controls**: Hidden (clean editing environment)
**User Intent**: Modify content, apply detailed formatting

## Component Architecture

```
ElementToolbar (Master Container)
├── SelectedToolbar (Selection state)
│   ├── TextSelectedToolbar
│   ├── ImageSelectedToolbar
│   └── ShapeSelectedToolbar
│
└── EditingToolbar (Edit state)
    ├── TextEditingToolbar
    ├── ImageEditingToolbar
    └── ShapeEditingToolbar
```

## State Management

### Element States

- `UNSELECTED`: No toolbar visible
- `SELECTED`: SelectedToolbar visible with transform controls
- `EDITING`: EditingToolbar visible, transform controls hidden

### State Transitions

- `Unselected → Single Click → Selected`
- `Selected → Double Click → Editing`
- `Selected → Click Away → Unselected`
- `Editing → Click Away → Selected (or Unselected based on UX decision)`
- `Editing → ESC Key → Selected`

## Positioning Requirements

### Universal Positioning Logic

- **Above element**: Toolbar positioned above the element bounds
- **Transform mode**: 120px clearance (40px handles + 60px toolbar + 20px gap)
- **Edit mode**: 80px clearance (no handles, closer to element)
- **Horizontal centering**: Toolbar centered on element width
- **Viewport bounds**: Keep toolbar within visible canvas area
- **Consistent Z-index**: Toolbar above all canvas elements but below modals

### Positioning Calculation

```javascript
// Pseudo-code
const calculateToolbarPosition = (element, stageRef, mode) => {
  const node = stage.findOne("#" + element.id);
  const nodePosition = node.getAbsolutePosition();
  const scale = stage.scaleX();
  const screenCoords = convertToScreenCoordinates(
    nodePosition,
    scale,
    stageRect
  );

  const topGap = mode === "editing" ? 80 : 120;
  const toolbarHeight = 60;

  return {
    top: screenCoords.y - toolbarHeight - topGap,
    left: screenCoords.x + (nodeWidth * scale) / 2,
    // Apply viewport constraints...
  };
};
```

## SelectedToolbar Requirements

### Common Pattern for All Elements

```
[Element-Specific Preview] | [Layer Controls] | [Element Actions]
```

### Text SelectedToolbar

**Content**: `[Arial 16px ▼] | [Layer ↑] [Layer ↓] | [Duplicate] [⋯ More]`
**Preview Section**: Combined font family + size button showing current style
**Purpose**: Quick font identification and basic object management

### Image SelectedToolbar

**Content**: `[🎨 Filter ▼] | [Layer ↑] [Layer ↓] | [Duplicate] [⋯ More]`
**Preview Section**: Current filter/effect indicator
**Purpose**: Quick filter preview and basic object management

### Shape SelectedToolbar

**Content**: `[🎨 Fill ▼] | [Layer ↑] [Layer ↓] | [Duplicate] [⋯ More]`
**Preview Section**: Fill color and stroke preview  
**Purpose**: Quick style preview and basic object management

### Universal Layer Controls (All Elements)

- **Bring Forward**: Move element up one layer
- **Send Backward**: Move element down one layer
- **Bring to Front**: Move element to top layer (in More menu)
- **Send to Back**: Move element to bottom layer (in More menu)

### Universal Element Actions (All Elements)

- **Duplicate**: Create copy of element
- **More Menu**: Progressive disclosure containing:
  - Delete (with confirmation for memory content)
  - Bring to Front / Send to Back
  - Lock / Unlock
  - Copy / Paste
  - Group / Ungroup (when multiple elements selected)

## EditingToolbar Requirements

### Text EditingToolbar

**Content**: `[Font ▼] [Size ▼] | [≡ ≣ ≣] | [A Color] | [B I U] | [Background ▼]`

**Sections**:

- **Typography**: Font family, font size (separate controls for precision)
- **Alignment**: Left, center, right text alignment
- **Color**: Text color picker
- **Text Style**: Bold, italic, underline toggles
- **Background**: Shape selection and styling

### Image EditingToolbar

**Content**: `[Brightness] [Contrast] | [Crop] [Rotate] | [Filter ▼] | [Opacity]`

**Sections**:

- **Adjustments**: Brightness, contrast, saturation sliders
- **Transform**: Crop tool, rotation controls
- **Effects**: Filter presets dropdown
- **Transparency**: Opacity slider

### Shape EditingToolbar

**Content**: `[Fill] [Stroke] | [Border Width] | [Corner Radius] | [Opacity]`

**Sections**:

- **Colors**: Fill color, stroke color pickers
- **Border**: Stroke width slider
- **Shape**: Corner radius for rectangles
- **Transparency**: Opacity slider

## Technical Requirements

### Props Interface

```typescript
interface ElementToolbarProps {
  selectedElement: CanvasElement | null;
  editingElement: CanvasElement | null;
  stageRef: React.RefObject<Konva.Stage>;
  updateElement: (element: CanvasElement) => void;
  onLayerChange: (elementId: string, direction: "up" | "down") => void;
  onDuplicate: (elementId: string) => void;
  onDelete: (elementId: string) => void;
  // ... other handlers
}
```

### Performance Considerations

- **Memoization**: Prevent unnecessary re-renders during canvas interactions
- **Position caching**: Cache position calculations when element hasn't moved
- **Debounced updates**: Debounce rapid style changes (like slider adjustments)
- **Lazy loading**: Load editing toolbars only when entering edit mode

### Responsive Design

- **Mobile optimization**: Larger touch targets, simplified layout
- **Tablet support**: Medium-sized controls, gesture-friendly
- **Desktop**: Full feature set with hover states and keyboard shortcuts

## Visual Design Requirements

### Toolbar Container

- **Background**: White with subtle drop shadow
- **Border radius**: 8px for modern appearance
- **Padding**: 8px internal spacing
- **Max width**: 800px to prevent oversized toolbars
- **Z-index**: 1000 (above canvas elements, below modals)

### Button Styling

- **Size**: Small (32px height) for compact appearance
- **Spacing**: 8px between button groups, 4px between related buttons
- **Active states**: Visual feedback for selected options
- **Hover states**: Subtle feedback for interactive elements
- **Icon consistency**: Use same icon library throughout

### Progressive Disclosure

- **More menu**: Collapsible menu for advanced/destructive actions
- **Popovers**: Complex controls (color pickers, sliders) in overlay panels
- **Tooltips**: Help text for all interactive elements

## Interaction Requirements

### Keyboard Support

- **ESC**: Exit edit mode, return to selected state
- **Delete**: Remove selected element (with confirmation)
- **Ctrl+D**: Duplicate selected element
- **Ctrl+]**: Bring forward
- **Ctrl+[**: Send backward

### Touch Support

- **Minimum touch target**: 44px for mobile accessibility
- **Gesture conflicts**: Prevent toolbar interactions from triggering canvas gestures
- **Touch feedback**: Visual feedback for touch interactions

### Error Handling

- **Invalid states**: Gracefully handle missing or corrupted element data
- **Network errors**: Handle save failures with retry options
- **Validation**: Prevent invalid property values

## Accessibility Requirements

### ARIA Support

- **Labels**: All controls have descriptive aria-labels
- **Roles**: Proper ARIA roles for toolbar and button groups
- **States**: Announce active/selected states to screen readers

### Keyboard Navigation

- **Tab order**: Logical navigation through toolbar controls
- **Focus management**: Maintain focus within toolbar when active
- **Escape hatch**: Always provide way to exit toolbar focus

## Integration Requirements

### Canvas Integration

- **Selection management**: Toolbar shows/hides based on canvas selection
- **Transform integration**: Coordinate with Konva transformer component
- **Event handling**: Prevent toolbar clicks from affecting canvas selection

### State Persistence

- **Element properties**: Changes immediately update element state
- **Undo/redo**: All toolbar actions support undo/redo system
- **Auto-save**: Changes automatically persist to backend

### Memory Management

- **Component cleanup**: Properly unmount toolbars when elements deleted
- **Event listeners**: Clean up event listeners to prevent memory leaks
- **Image loading**: Efficient loading of toolbar preview images

## Testing Requirements

### Unit Tests

- **Component rendering**: Each toolbar component renders correctly
- **Props handling**: Proper handling of all prop combinations
- **State transitions**: Correct behavior for state changes

### Integration Tests

- **Canvas interaction**: Toolbar appears/disappears correctly with selection
- **Element updates**: Property changes properly update canvas elements
- **Cross-browser**: Consistent behavior across supported browsers

### Accessibility Tests

- **Screen reader**: Toolbar usable with screen reader software
- **Keyboard only**: All functionality accessible via keyboard
- **Color contrast**: Sufficient contrast for visually impaired users

## Implementation Phases

### Phase 1: Foundation

1. Create ElementToolbar master container
2. Implement universal positioning logic
3. Set up state management for selection/editing modes
4. Create basic SelectedToolbar for text elements

### Phase 2: Text Complete

1. Enhance TextSelectedToolbar with proper preview
2. Create TextEditingToolbar with full controls
3. Implement state transitions between selection/editing
4. Add layer management functionality

### Phase 3: Universal System

1. Create ImageSelectedToolbar and ImageEditingToolbar
2. Create ShapeSelectedToolbar and ShapeEditingToolbar
3. Implement universal element actions (duplicate, delete, etc.)
4. Add "More" menu with advanced options

### Phase 4: Polish

1. Add animations and transitions
2. Implement full keyboard support
3. Add comprehensive error handling
4. Performance optimization and testing

## Success Criteria

- **Consistent UX**: All element types follow same interaction patterns
- **Professional feel**: Matches quality of established design tools
- **Performance**: No noticeable lag during toolbar interactions
- **Accessibility**: Meets WCAG 2.1 AA standards
- **Mobile ready**: Fully functional on touch devices
- **Extensible**: Easy to add new element types and toolbar features

This architecture provides a solid foundation for implementing a professional-grade toolbar system that enhances the memory sharing application's usability while maintaining consistency across all element types.

## Current Architecture Analysis

- **Element Structure**: Each element type has a base class (BaseCanvasElement) and specific implementations
- **Renderer Pattern\*\***: Each element type has its own renderer (TextRenderer, PhotoRenderer, etc.) that handles rendering logic

### Current Selection/Editing States:

Selection is handled by isSelected prop and shows DeleteButton + Transformer
Text editing is handled separately in TextRenderer with double-click to edit
TextToolUI provides editing controls that appear above text elements
Current Issues:

Delete button is rendered individually in each renderer
No consistent toolbar system across element types
Text editing UI is separate from selection UI
PhotoRenderer has no editing capabilities

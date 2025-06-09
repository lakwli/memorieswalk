# Simplified Architecture Plan

## Problem

Current architecture has too many layers handling overlapping responsibilities:

- MemoryEditorPage
- useElementBehaviors
- useCanvasElements (to rename useElementState)
- useCanvasTools
- ToolManager
- Individual Tools (TextTool, PhotoTool)
- Renderers

This creates a mess where events, positioning, rendering, and useEffects are scattered across multiple classes.

## Principle: Keep It Simple

- useElementState should remain the cleanest - only handle element data/state
- MemoryEditorPage should be the CEO - handle all user interactions directly
- Minimize the number of classes involved

## Proposed Simple Structure

### MemoryEditorPage (CEO)

```javascript
// Direct user action handlers
const addTextToCanvas = useCallback(() => {
  const textElement = new TextElement({
    x: getViewportCenter().x,
    y: getViewportCenter().y,
    text: "New Text",
  });
  addElement(textElement);
  setSelectedElement(textElement);
}, [addElement, setSelectedElement]);

const addPenToCanvas = useCallback(() => {
  // Direct pen creation
}, []);

// Generic function (optional)
const addElementToCanvas = useCallback(
  (elementType, config) => {
    switch (elementType) {
      case ELEMENT_TYPES.TEXT:
        return addTextToCanvas();
      case ELEMENT_TYPES.PEN:
        return addPenToCanvas();
    }
  },
  [addTextToCanvas, addPenToCanvas]
);
```

### useElementState (Clean State Management)

```javascript
// Keep this CLEAN - only state management
export const useElementState = () => {
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);

  const addElement = (element) => {
    setElements((prev) => [...prev, element]);
  };

  const removeElement = (id) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
  };

  // NO positioning logic
  // NO creation logic
  // NO event handling
  // JUST state management
};
```

### What to Remove/Simplify

1. **useCanvasTools** - move logic directly to MemoryEditorPage
2. **ToolManager** - remove, handle tools directly in MemoryEditorPage
3. **Individual Tool classes** - simplify to direct element creation
4. **Complex callback chains** - direct function calls

## Benefits

1. Clear single point of control (MemoryEditorPage)
2. Clean state management (useElementState)
3. No scattered responsibilities
4. Easy to debug and maintain
5. No more "fix here breaks there" issues

## Implementation Steps

1. Move element creation logic to MemoryEditorPage
2. Remove useCanvasTools dependency
3. Simplify tool handling
4. Keep useElementState focused on state only

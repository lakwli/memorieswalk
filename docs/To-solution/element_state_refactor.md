# Element State Management Refactor

## Current Issues

1. Element state management is scattered across multiple components
2. Updates to elements cause unnecessary re-renders and focus loss
3. Unclear update paths for element modifications

## Proposed Changes

### 1. Rename and Consolidate

- Rename `useCanvasElements` to `useElementState` to better reflect its role
- Move all element state management into this single hook

### 2. Core Responsibilities

```javascript
export const useElementState = () => {
  // State
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const elementStates = useRef({});

  // All element modifications happen through these methods
  const updateElement = (
    elementId,
    updates,
    options = { triggerRender: false }
  ) => {
    const element = elements.find((el) => el.id === elementId);
    if (element) {
      Object.assign(element, updates);
      if (options.triggerRender) {
        setElements([...elements]); // Only re-render when needed
      }
    }
  };

  // Other operations...
};
```

### 3. Update Flows to Consolidate

- Move element update logic from useElementBehaviors
- Move transform handling from MemoryEditorPage
- Direct Konva updates when possible to avoid re-renders

### 4. Integration Points

#### MemoryEditorPage

```javascript
const { elements, updateElement, selectedElement, setSelectedElement } =
  useElementState();

// Use these methods instead of direct state updates
```

#### ElementRenderer

```javascript
const handleUpdate = (updates) => {
  updateElement(element.id, updates);
};
```

## Benefits

1. Single source of truth for element state
2. Controlled update paths prevent unexpected state changes
3. Optimized updates to minimize re-renders
4. Clear separation between state management and UI

## Migration Plan

1. Create new useElementState hook
2. Move state management from useCanvasElements
3. Update element update paths in MemoryEditorPage
4. Remove redundant state management from other components
5. Update all component references

## Next Steps

1. Create PR for rename and initial consolidation
2. Update element modification paths
3. Add optimized update methods
4. Update component references
5. Test focus retention during updates

import { useState, useCallback, useRef, useMemo } from "react";
import { createCanvasElement } from "../components/canvas/elements/elementFactory.js";
import { ELEMENT_STATES } from "../constants";

export const useCanvasElements = () => {
  const [elements, setElements] = useState([]);
  const [isEditing, setIsEditing] = useState(false); // ← Simple boolean flag
  const elementStates = useRef({}); // For photo states or other element-specific state
  const selectedElementRef = useRef(null);
  const editingElement = isEditing ? getSelectedElement() : null;

  const updateElement = useCallback((elementId, updates) => {
    console.log("🔄 updateElement called:", { elementId, updates });

    setElements((prev) => {
      console.log("🔄 setElements prev state:", prev.length, "elements");

      // ✅ Find the element and update it in-place
      const element = prev.find((el) => el.id === elementId);
      if (!element) {
        console.log("🔄 Element not found:", elementId);
        return prev; // Same array reference - no re-render
      }

      console.log("🔄 Updating element:", elementId, "with:", updates);
      console.log("🔄 Element BEFORE Object.assign:", element);

      // ✅ Mutate the element in-place (your approach is correct)
      Object.assign(element, updates);

      console.log("🔄 Element AFTER Object.assign:", element);

      // ✅ Create new array reference to trigger React's change detection
      // (Since we mutated an object inside the array, React won't detect it without this)
      const newElements = [...prev];

      console.log("🔄 setElements new state:", newElements.length, "elements");
      console.log("🔄 Array reference changed:", prev !== newElements);
      console.log(
        "🔄 All elements same objects:",
        prev.every((el, index) => el === newElements[index])
      );

      return newElements;
    });
  }, []);

  const editingManager = useMemo(
    () => ({
      // Check if element is in editing mode
      isElementEditing: (elementId) => {
        return isEditing && selectedElementRef.current?.id === elementId;
      },

      // Start editing mode for an element
      startEditing: (element) => {
        if (element) {
          selectedElementRef.current = element;
          setIsEditing(true);
        }
      },

      // End editing mode
      endEditing: () => {
        setIsEditing(false);
      },

      // Update element while preserving editing state
      updateElementInEditMode: (elementId, updates) => {
        console.log("📝 updateElementInEditMode called:", {
          elementId,
          updates,
          timestamp: new Date().toISOString(),
        });

        updateElement(elementId, updates);
      },
    }),
    [isEditing, updateElement]
  );

  // Create element
  const createElement = (type, props = {}) => {
    console.log("🏗️ createElement called:");
    console.log("🏗️ Type:", type);
    console.log("🏗️ Props:", props);

    const newElement = createCanvasElement(type, props);
    console.log("🏗️ Created element:", newElement.id);

    // ALL elements MUST have state - assign NEW state to every new element
    elementStates.current[newElement.id] = ELEMENT_STATES.NEW;

    setElements((prev) => {
      const newElements = [...prev, newElement];
      console.log("🏗️ setElements updating:");
      console.log(
        "🏗️ Previous elements:",
        prev.map((el) => el.id)
      );
      console.log(
        "🏗️ New elements:",
        newElements.map((el) => el.id)
      );
      return newElements;
    });

    console.log("🏗️ createElement completed, returning:", newElement.id);
    return newElement;
  };

  // ✅ Simplified getters - only for selectedElement
  const getSelectedElement = useCallback(() => {
    return selectedElementRef.current;
  }, []);

  const getSelectedElementId = useCallback(() => {
    return selectedElementRef.current?.id || null;
  }, []);

  // ✅ Simplified setSelectedElement - no ID synchronization needed
  const setSelectedElement = useCallback((element) => {
    console.log("🔧 setSelectedElement called:", {
      from: selectedElementRef.current?.id || null,
      to: element?.id || null,
    });

    if (selectedElementRef.current === element) {
      console.log("🔧 setSelectedElement: No change, skipping update");
      return;
    }

    if (element === null) {
      console.log("🚨 SELECTION BEING CLEARED!");
      console.trace("🚨 Call stack that cleared selection:");
    }

    selectedElementRef.current = element;
    console.log("🔧 Selection updated to:", element?.id || "null");
  }, []);

  // ✅ Add setSelectedElementById for cases where you only have ID
  const setSelectedElementById = useCallback(
    (elementId) => {
      console.log("🔧 setSelectedElementById called:", elementId);

      if (!elementId) {
        setSelectedElement(null);
        return;
      }

      // Find element in current state
      setElements((currentElements) => {
        const found = currentElements.find((el) => el.id === elementId);
        if (found) {
          selectedElementRef.current = found;
          console.log("🔧 Found and selected element by ID:", found.id);
        } else {
          console.log("🔧 Element not found by ID:", elementId);
          selectedElementRef.current = null;
        }
        return currentElements; // Return same array
      });
    },
    [setSelectedElement]
  ); // ✅ Add setSelectedElement to dependencies

  // Remove element
  // Remove element
  const removeElement = useCallback(
    (elementId) => {
      setElements((prev) => {
        const elementToRemove = prev.find((el) => el.id === elementId);
        if (elementToRemove?.cleanup) {
          elementToRemove.cleanup();
        }
        return prev.filter((el) => el.id !== elementId);
      });

      // ✅ Clear selection if removing selected element
      if (selectedElementRef.current?.id === elementId) {
        setSelectedElement(null);
      }

      // Handle element state for photo deletion
      const currentState = elementStates.current[elementId];
      if (currentState === ELEMENT_STATES.PERSISTED) {
        elementStates.current[elementId] = ELEMENT_STATES.REMOVED;
      } else {
        delete elementStates.current[elementId];
      }
    },
    [setSelectedElement]
  );

  // Editing state management
  const startEditing = useCallback(() => {
    const currentSelected = getSelectedElement();
    if (currentSelected) {
      setIsEditing(true);
    }
  }, [getSelectedElement]);

  const endEditing = useCallback(() => {
    setIsEditing(false);
  }, []);

  // Check if element is currently being edited
  const isElementEditing = useCallback(
    (elementId) => {
      const currentSelected = getSelectedElement();
      return isEditing && currentSelected?.id === elementId;
    },
    [isEditing, getSelectedElement]
  );
  // Get elements by type
  const getElementsByType = useCallback(
    (type) => {
      return elements.filter((el) => el.type === type);
    },
    [elements]
  );

  // Get all elements for save
  const getElementsForSave = useCallback(() => {
    return elements.map((el) => el.toSaveData());
  }, [elements]);

  // Load elements from save data
  const loadElements = useCallback((saveData) => {
    const loadedElements = saveData.map((data) => {
      return createCanvasElement(data.type, data);
    });
    setElements(loadedElements);
  }, []);

  return {
    elements,
    setElements,
    getSelectedElementId, // ✅ Make sure this is included
    getSelectedElement, // ✅ Make sure this is included
    setSelectedElement,
    setSelectedElementById, // ✅ Make sure this is included if it exists
    editingElement,
    editingManager,
    isEditing, // ← Add this missing export
    startEditing, // ← Add this missing export
    endEditing, // ← Add this missing export
    isElementEditing, // ← Add this missing export

    elementStates,
    createElement,
    removeElement,
    updateElement,
    getElementsByType,
    getElementsForSave,
    loadElements,
  };
};

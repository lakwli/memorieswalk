import { useState, useCallback, useRef, useMemo } from "react";
import { createCanvasElement } from "../components/canvas/elements/elementFactory.js";
import { ELEMENT_STATES } from "../constants";

export const useCanvasElements = () => {
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [isEditing, setIsEditing] = useState(false); // ← Simple boolean flag
  const elementStates = useRef({}); // For photo states or other element-specific state
  const editingElement = isEditing ? selectedElement : null;

  const setNewSelectedElement = useCallback((element) => {
    console.log("🔄 updateSelectedElement called:", element);

    setSelectedElement((currentSelected) => {
      // ✅ Compare inside state setter to avoid dependency
      if (element === currentSelected) {
        console.log("🔄 Same element - no update");
        return currentSelected; // Return same value = no state change
      }

      console.log("🔄 Different element - updating");
      return element;
    });
  }, []); // ✅ Empty dependencies

  const updateElement = useCallback(
    (elementId, updates) => {
      console.log("🔄 updateElement called:", { elementId, updates });

      setElements((prev) => {
        console.log("🔄 setElements prev state:", prev.length, "elements");

        const element = prev.find((el) => el.id === elementId);
        if (!element) {
          console.log("🔄 Element not found:", elementId);
          return prev;
        }

        console.log("🔄 Updating element:", elementId, "with:", updates);
        console.log("🔄 Element BEFORE Object.assign:", element);

        element.newUpdate(updates);

        console.log("🔄 Element AFTER Object.assign:", element);

        // ✅ Add debugging for the selection check
        console.log("🔄 Selection check:", {
          elementId: element.id,
          selectedElementId: selectedElement?.id,
          selectedElement: selectedElement,
          isMatch: element.id === selectedElement?.id,
        });

        setNewSelectedElement({ ...element });

        return prev;
      });
    },
    [selectedElement, setNewSelectedElement]
  ); // ✅ Add dependencies

  const editingManager = useMemo(
    () => ({
      // Check if element is in editing mode
      isElementEditing: (elementId) => {
        return isEditing && selectedElement?.id === elementId;
      },

      // Start editing mode for an element
      startEditing: (element) => {
        if (element) {
          setSelectedElement(element);
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
    [isEditing, updateElement, selectedElement]
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
          console.log("🔧 Found and selected element by ID:", found.id);
          setSelectedElement(found);
        } else {
          console.log("🔧 Element not found by ID:", elementId);
          setSelectedElement(null);
        }
        return currentElements; // Return same array
      });
    },
    [setSelectedElement]
  ); // ✅ Include both dependencies

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
      if (selectedElement?.id === elementId) {
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
    [setSelectedElement, selectedElement]
  );

  // Editing state management
  const startEditing = useCallback(() => {
    if (selectedElement) {
      setIsEditing(true);
    }
  }, [selectedElement]);

  const endEditing = useCallback(() => {
    setIsEditing(false);
  }, []);

  // Check if element is currently being edited
  const isElementEditing = useCallback(
    (elementId) => {
      return isEditing && selectedElement?.id === elementId;
    },
    [isEditing, selectedElement]
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
    selectedElement,
    //getSelectedElementId, // ✅ Make sure this is included
    //getSelectedElement, // ✅ Make sure this is include
    setSelectedElementById, // ✅ Add this to use the function
    setNewSelectedElement, // Export the unused function
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

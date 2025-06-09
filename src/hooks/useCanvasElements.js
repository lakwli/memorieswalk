import { useState, useCallback, useRef } from "react";
import { createCanvasElement } from "../components/canvas/elements/elementFactory.js";
import { ELEMENT_STATES } from "../constants";

export const useCanvasElements = () => {
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const elementStates = useRef({}); // For photo states or other element-specific state

  // Create element
  const createElement = useCallback((type, props = {}) => {
    const newElement = createCanvasElement(type, props);

    // ALL elements MUST have state - assign NEW state to every new element
    elementStates.current[newElement.id] = ELEMENT_STATES.NEW;

    setElements((prev) => [...prev, newElement]);
    return newElement;
  }, []);

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

      if (selectedElement?.id === elementId) {
        setSelectedElement(null);
      }

      // Handle element state for photo deletion
      const currentState = elementStates.current[elementId];
      if (currentState === ELEMENT_STATES.PERSISTED) {
        // Mark persistent elements as removed for database deletion
        elementStates.current[elementId] = ELEMENT_STATES.REMOVED;
      } else {
        // For new elements or other elements, just remove the state
        delete elementStates.current[elementId];
      }
    },
    [selectedElement]
  );

  // Update element
  const updateElement = useCallback((elementId, updates) => {
    console.log("🔄 updateElement called:", {
      elementId,
      updates,
      timestamp: new Date().toISOString(),
    });

    setElements((prev) => {
      console.log(
        "🔄 setElements prev state:",
        prev.map((el) => ({ id: el.id, type: el.type }))
      );

      const newElements = prev.map((el) => {
        if (el.id === elementId) {
          console.log("🔄 Updating element:", el.id, "with:", updates);
          // Preserve the class instance by updating properties directly
          // This avoids creating a new object reference
          Object.assign(el, updates);
          return el;
        }
        return el;
      });

      console.log(
        "🔄 setElements new state:",
        newElements.map((el) => ({ id: el.id, type: el.type }))
      );
      return newElements;
    });
  }, []);

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
    setSelectedElement,
    elementStates,
    createElement,
    removeElement,
    updateElement,
    getElementsByType,
    getElementsForSave,
    loadElements,
  };
};

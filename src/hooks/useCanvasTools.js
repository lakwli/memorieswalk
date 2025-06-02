// useCanvasTools - Hook for managing canvas tools
import { useRef, useCallback, useEffect } from "react";
import { ToolManager } from "../components/canvas/tools";

export const useCanvasTools = (canvasConfig) => {
  const toolManagerRef = useRef(null);

  // Initialize tool manager
  useEffect(() => {
    if (canvasConfig.stageRef) {
      toolManagerRef.current = new ToolManager(canvasConfig);
    }
  }, [canvasConfig]);

  // Update canvas config when it changes
  useEffect(() => {
    if (toolManagerRef.current) {
      toolManagerRef.current.updateCanvasConfig(canvasConfig);
    }
  }, [canvasConfig]);

  // Set active tool
  const setActiveTool = useCallback((toolType) => {
    if (toolManagerRef.current) {
      toolManagerRef.current.setActiveTool(toolType);
    }
  }, []);

  // Get active tool
  const getActiveTool = useCallback(() => {
    return toolManagerRef.current?.getActiveTool() || null;
  }, []);

  // Handle stage click
  const handleToolStageClick = useCallback(
    (e, addElement, setSelectedElement) => {
      if (toolManagerRef.current) {
        return toolManagerRef.current.handleStageClick(
          e,
          addElement,
          setSelectedElement
        );
      }
      return null;
    },
    []
  );

  // Handle file upload
  const handleToolFileUpload = useCallback(
    async (files, elementStates, addElements) => {
      if (toolManagerRef.current) {
        return await toolManagerRef.current.handleFileUpload(
          files,
          elementStates,
          addElements
        );
      }
      return [];
    },
    []
  );

  // Add text at center
  const addTextAtCenter = useCallback((addElement, setSelectedElement) => {
    if (toolManagerRef.current) {
      return toolManagerRef.current.addTextAtCenter(
        addElement,
        setSelectedElement
      );
    }
    return null;
  }, []);

  // Handle text drop
  const handleTextDrop = useCallback(
    (droppedText, addElement, setSelectedElement) => {
      if (toolManagerRef.current) {
        return toolManagerRef.current.handleTextDrop(
          droppedText,
          addElement,
          setSelectedElement
        );
      }
      return null;
    },
    []
  );

  // Get cursor style
  const getToolCursorStyle = useCallback(() => {
    if (toolManagerRef.current) {
      return toolManagerRef.current.getCursorStyle();
    }
    return "grab";
  }, []);

  // Get specific tool
  const getTool = useCallback((toolType) => {
    return toolManagerRef.current?.getTool(toolType) || null;
  }, []);

  return {
    setActiveTool,
    getActiveTool,
    handleToolStageClick,
    handleToolFileUpload,
    addTextAtCenter,
    handleTextDrop,
    getToolCursorStyle,
    getTool,
    toolManager: toolManagerRef.current,
  };
};

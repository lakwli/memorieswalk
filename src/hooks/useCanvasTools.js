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

  // Get specific tool
  const getTool = useCallback((toolType) => {
    return toolManagerRef.current?.getTool(toolType) || null;
  }, []);

  return {
    getTool,
    toolManager: toolManagerRef.current,
  };
};

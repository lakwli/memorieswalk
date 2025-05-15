# Phase 2: "My Canvases" Dashboard & Canvas Editor Implementation Details

This document outlines the technical implementation details for Phase 2, focusing on the "My Canvases" Dashboard and the initial setup for the Canvas Editor. It has been updated to reflect the use of **Chakra UI** as the primary UI component library and **React-Konva** for canvas rendering. Visual styling should strictly adhere to the specifications in `docs/screenshots/dashboard/dashboard.png.md` and `docs/screenshots/canvas/canvas.png.md`.

## 1. Technology Stack & Dependencies

### Core Libraries

```json
{
  "dependencies": {
    "@chakra-ui/react": "^2.8.0", // Or latest stable
    "@chakra-ui/icons": "^2.1.0", // Or latest stable
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "framer-motion": "^10.16.0", // Or latest stable (peer for Chakra UI)
    "konva": "^9.2.0", // Or latest stable
    "react-konva": "^18.2.10", // Or latest stable
    "react-dropzone": "^14.2.3",
    "react-router-dom": "^6.15.0" // Or latest stable
    // "react-icons": "^4.10.0" // Optional, for a wider range of icons
  }
}
```

**Note:** `notistack` (for MUI toasts) is replaced by Chakra UI's built-in `useToast` hook.

## 2. Component Structure

### A. Directory Layout

The proposed directory layout remains a good guideline:

```
src/
├── components/
│   ├── dashboard/
│   │   ├── CanvasGrid.jsx
│   │   ├── SearchBar.jsx
│   │   └── ActionsBar.jsx // Or integrate actions directly into DashboardPage/AppHeader
│   ├── editor/
│   │   ├── KonvaCanvas.jsx
│   │   ├── EditorToolbar.jsx // Renamed for clarity
│   │   ├── TopNavigationBar.jsx // For editor's top bar
│   │   └── ShareModal.jsx
│   └── common/
│       ├── AppHeader.jsx // Main app header, potentially used on Dashboard
│       └── LoadingSpinner.jsx
├── pages/
│   ├── DashboardPage.jsx
│   └── CanvasEditorPage.jsx
├── theme/
│   └── index.js          // Chakra UI theme customization
├── context/
│   └── AuthContext.jsx   // Remains for authentication
├── hooks/
│   └── useCanvas.js      // Remains for canvas logic
├── services/
│   └── canvasService.js  // Remains for API calls
└── App.jsx
└── main.jsx            // ChakraProvider setup here
```

### B. Component Implementation Details (Conceptual - using Chakra UI)

All components will be built using Chakra UI. Styling details (colors, fonts, spacing, dimensions) must be sourced from `docs/screenshots/dashboard/dashboard.png.md` and `docs/screenshots/canvas/canvas.png.md`.

#### 1. Dashboard Components

Refer to `docs/screenshots/dashboard/dashboard.png.md` for all styling.

##### `AppHeader.jsx` (Common, used on Dashboard)

- Uses Chakra `Flex`, `Heading` (for "My Canvas" title, bold 24px), `Avatar` (40x40px, initials).
- May include a `ThemeToggle` component if dark mode is implemented.

##### `SearchBar.jsx` (`src/components/dashboard/`)

- Uses Chakra `InputGroup`, `InputLeftElement` (with `SearchIcon` from `@chakra-ui/icons`), `Input`.
- Styles: Placeholder "Search photos, albums or places...", background `#F0F2F5`, rounded corners (4px).

##### `ActionsBar.jsx` or integrated into `DashboardPage.jsx`

- **Create Canvas Button:** Chakra `Button`. Full width, height ~48px, background `#3578E5` (primary blue), white text (16px), rounded corners (4px).
- **Delete Canvas Button (if applicable here):** Chakra `Button`, styled as per mockups if a global delete is present on the dashboard.

##### `CanvasGrid.jsx` (`src/components/dashboard/`)

- Uses Chakra `Heading` for "Recent Canvas" (bold 18px) and `Link` for "View All".
- Uses Chakra `SimpleGrid` (columns={2}) or `Grid` to achieve the 2-column layout.
- Each canvas card: Chakra `Box` styled as a square (100x100px), light pastel background, rounded corners (8px).
- Displays canvas title (e.g., "Travel 2024" bold 14px dark gray) using Chakra `Text`.
- Thumbnail can be an `Image` component or a styled `Box` with background.

#### 2. Canvas Editor Components (Initial Setup)

Refer to `docs/screenshots/canvas/canvas.png.md` for all styling.

##### `TopNavigationBar.jsx` (`src/components/editor/`)

- Uses Chakra `Flex` (height ~56px, background `#F7F9FA`).
- Contains:
  - `IconButton` (with `ArrowBackIcon`) for back navigation.
  - `Box` with `Heading` (canvas title, e.g., "Travel 2024", bold 20px) and `Text` (subtitle, e.g., "My Creative Space", 14px, color `#6B6B6B`).
  - `HStack` for action buttons:
    - "Save" `Button`: background `#3578E5`, white text.
    - "Share" `Button`: white background, `#3578E5` border and text.

##### `EditorToolbar.jsx` (`src/components/editor/`)

- Uses Chakra `Flex` (fixed bottom, translucent white background, height ~64px).
- Contains five equally spaced tool buttons. Each tool:
  - Chakra `Box` or `VStack` for icon and label.
  - `IconButton` or `Button` with a monochrome outline icon (24x24px, consider `react-icons` or custom SVGs).
  - `Text` for label below icon (12px, color `#4B4B4B`).
  - Active tool state: blue icon and/or underline.

##### `KonvaCanvas.jsx` (`src/components/editor/`)

- The core `react-konva` (`Stage`, `Layer`, `Image`, `Text`, `Line`) implementation remains similar to the original plan.
- It will be embedded within the main content area of `CanvasEditorPage.jsx`.
- The `width` and `height` props will be managed by `CanvasEditorPage.jsx` to fit the available space.
- Background should be white as per `docs/screenshots/canvas/canvas.png.md:24`.

##### `ShareModal.jsx` (`src/components/editor/`)

- Uses Chakra `Modal`, `ModalOverlay`, `ModalContent`, `ModalHeader`, `ModalBody`, `ModalFooter`, `Input`, `Button`.
- Styled according to general app theme and modal best practices.

#### 3. Page Components

##### `DashboardPage.jsx` (`src/pages/`)

- Main layout: Centered `Box` with fixed width (e.g., 360px) as per `docs/screenshots/dashboard/dashboard.png.md:5`.
- Composes `AppHeader`, `SearchBar`, "Create Canvas" `Button`, and `CanvasGrid`.
- Handles fetching canvas list via `canvasService` and manages related state.

##### `CanvasEditorPage.jsx` (`src/pages/`)

- Composes `TopNavigationBar`, the main canvas area (containing `KonvaCanvas`), and `EditorToolbar`.
- Manages overall editor state: canvas data, selected tool, etc.
- Handles API calls for fetching/saving canvas data via `canvasService`.

### C. Custom Hooks

#### `useCanvas.js` (`src/hooks/`)

The existing `useCanvas.js` structure for managing `objects`, `selectedId`, and `tool`, along with functions like `addObject`, `updateObject`, `deleteObject`, `moveToLayer`, is largely UI-agnostic and can be retained.

```javascript
import { useState, useCallback } from "react";

export const useCanvas = (initialObjects = []) => {
  const [objects, setObjects] = useState(initialObjects);
  const [selectedId, setSelectedId] = useState(null);
  const [tool, setTool] = useState("select"); // e.g., 'select', 'draw', 'text'

  const addObject = useCallback((object) => {
    setObjects((prev) => [...prev, { ...object, id: Date.now().toString() }]);
  }, []);

  const updateObject = useCallback((id, updates) => {
    setObjects((prev) =>
      prev.map((obj) => (obj.id === id ? { ...obj, ...updates } : obj))
    );
  }, []);

  const deleteObject = useCallback((id) => {
    setObjects((prev) => prev.filter((obj) => obj.id !== id));
  }, []);

  const moveToLayer = useCallback((id, direction) => {
    // ... (implementation for reordering objects)
    setObjects((prev) => {
      const index = prev.findIndex((obj) => obj.id === id);
      if (index === -1) return prev;

      const newObjects = [...prev];
      const [movedObj] = newObjects.splice(index, 1);

      if (direction === "forward" && index < newObjects.length) {
        newObjects.splice(index + 1, 0, movedObj);
      } else if (direction === "backward" && index > 0) {
        newObjects.splice(index - 1, 0, movedObj);
      } else if (direction === "toFront") {
        newObjects.push(movedObj);
      } else if (direction === "toBack") {
        newObjects.unshift(movedObj);
      }
      return newObjects;
    });
  }, []);

  return {
    objects,
    selectedId,
    tool,
    addObject,
    updateObject,
    deleteObject,
    moveToLayer,
    setSelectedId,
    setTool,
    setObjects, // Expose setObjects for loading data
  };
};
```

## 3. API Integration

### `canvasService.js` (`src/services/`)

This service remains structurally the same for backend communication.

```javascript
// src/services/canvasService.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

class CanvasService {
  async getCanvases() {
    // TODO: Add authentication headers
    const response = await fetch(`${API_BASE_URL}/canvases`);
    if (!response.ok) throw new Error("Failed to fetch canvases");
    return response.json();
  }

  async getCanvasById(id) {
    // TODO: Add authentication headers
    const response = await fetch(`${API_BASE_URL}/canvases/${id}`);
    if (!response.ok) throw new Error(`Failed to fetch canvas ${id}`);
    return response.json();
  }

  async createCanvas(title) {
    // TODO: Add authentication headers
    const response = await fetch(`${API_BASE_URL}/canvases`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!response.ok) throw new Error("Failed to create canvas");
    return response.json();
  }

  async saveCanvas(id, canvasData, title, thumbnailUrl) {
    // TODO: Add authentication headers
    const payload = { canvas_data: canvasData };
    if (title) payload.title = title;
    if (thumbnailUrl) payload.thumbnail_url = thumbnailUrl; // Or handle thumbnail on backend

    const response = await fetch(`${API_BASE_URL}/canvases/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("Failed to save canvas");
    return response.json();
  }

  async deleteCanvas(id) {
    // TODO: Add authentication headers
    const response = await fetch(`${API_BASE_URL}/canvases/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete canvas");
    return response.json(); // Or handle no content
  }

  // Thumbnail generation might be client-side (using canvas.toDataURL())
  // or server-side. For now, assume client sends it or backend generates it.
  async generateThumbnailFromKonvaStage(stage) {
    if (!stage) return null;
    // Ensure quality and desired format, e.g., image/jpeg for smaller size
    return stage.toDataURL({
      mimeType: "image/jpeg",
      quality: 0.8,
      pixelRatio: 0.5,
    });
  }
}

export const canvasService = new CanvasService();
```

## 4. State Management

### A. Canvas State Structure (Konva Objects)

The `CanvasObject` interface for Konva items remains relevant.

```typescript
interface CanvasObject {
  id: string;
  type: "image" | "text" | "rect" | "freehand"; // Add more types as needed
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  fill?: string; // For shapes
  stroke?: string; // For shapes/lines
  strokeWidth?: number; // For shapes/lines
  // Type-specific properties
  text?: string; // For text
  fontSize?: number; // For text
  fontFamily?: string; // For text
  points?: number[]; // For freehand drawings/lines
  src?: string; // For images (URL or data URL)
  konvaImage?: HTMLImageElement; // Preloaded image for Konva
  // Add other Konva properties as needed
}

interface CanvasData {
  // Represents the content saved to backend
  objects: CanvasObject[];
  // Potentially viewport info if zoom/pan is saved
  // width?: number; // Original canvas dimensions if different from viewport
  // height?: number;
}

interface EditorState {
  // Overall state for the editor page
  currentCanvasId: string | null;
  canvasTitle: string;
  canvasSubtitle?: string; // As per canvas.png.md
  objects: CanvasObject[];
  selectedObjectId: string | null;
  activeTool: string; // e.g., 'select', 'text', 'draw', 'upload'
  isLoading: boolean;
  error: string | null;
  // Zoom/pan state if implemented
  // scale?: number;
  // position?: { x: number; y: number };
}
```

### B. Auto-save Implementation

The `useAutoSave` hook logic is still applicable. It would call `canvasService.saveCanvas`.

```javascript
// src/hooks/useAutoSave.js
import { useEffect, useRef } from "react";
import { canvasService } from "../services/canvasService"; // Adjust path

const useAutoSave = (canvasId, objects, title, konvaStageRef) => {
  const debouncedSave = useRef(null);

  useEffect(() => {
    if (debouncedSave.current) {
      clearTimeout(debouncedSave.current);
    }

    debouncedSave.current = setTimeout(async () => {
      if (canvasId && objects && objects.length > 0 && konvaStageRef.current) {
        try {
          // Generate thumbnail before saving
          const thumbnailUrl =
            await canvasService.generateThumbnailFromKonvaStage(
              konvaStageRef.current
            );
          await canvasService.saveCanvas(
            canvasId,
            { objects },
            title,
            thumbnailUrl
          );
          // Optionally show a success toast (non-intrusively)
          console.log("Auto-saved canvas:", canvasId);
        } catch (error) {
          console.error("Auto-save failed:", error);
          // Optionally show an error toast
        }
      }
    }, 3000); // Auto-save after 3 seconds of inactivity/changes

    return () => {
      if (debouncedSave.current) {
        clearTimeout(debouncedSave.current);
      }
    };
  }, [canvasId, objects, title, konvaStageRef]);
};

export default useAutoSave;
```

## 5. Error Handling & Loading States (Chakra UI)

### A. Loading States

Use Chakra UI's `Spinner` or `Skeleton` components.

```jsx
// src/components/common/LoadingSpinner.jsx
import { Box, Spinner } from "@chakra-ui/react";

const LoadingSpinner = ({
  size = "xl",
  thickness = "4px",
  speed = "0.65s",
  color = "blue.500",
}) => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="200px"
  >
    <Spinner
      size={size}
      thickness={thickness}
      speed={speed}
      color={color}
      emptyColor="gray.200"
    />
  </Box>
);

// Example Skeleton for Canvas Cards
// import { Skeleton, SkeletonText, SimpleGrid, Box } from "@chakra-ui/react";
// const CanvasGridSkeleton = () => (
//   <SimpleGrid columns={2} spacing="16px"> {/* As per dashboard.png.md */}
//     {[...Array(6)].map((_, i) => (
//       <Box key={i} borderWidth="1px" borderRadius="lg" overflow="hidden" p={4}
//            height="100px" width="100px"> {/* As per dashboard.png.md */}
//         <Skeleton height="60px" />
//         <SkeletonText mt="3" noOfLines={1} spacing="3" />
//       </Box>
//     ))}
//   </SimpleGrid>
// );
```

### B. Error Notifications

Use Chakra UI's `useToast` hook for displaying error messages.

```javascript
// Example usage in a component
// import { useToast } from "@chakra-ui/react";
// const toast = useToast();
// toast({
//   title: "An error occurred.",
//   description: "Unable to save canvas.",
//   status: "error",
//   duration: 5000,
//   isClosable: true,
// });
```

An `ErrorBoundary` component can still be used for catching rendering errors, using Chakra components for its UI.

## 6. Testing Strategy

The general testing strategy (unit tests for components/hooks, integration tests for user flows) remains valid. Tests for Chakra UI components would use `@testing-library/react`.

## 7. Performance Optimizations

- **React-Konva:** Caching shapes (`shape.cache()`), using `Konva.FastLayer` if appropriate, virtualizing large numbers of objects.
- **React:** `React.memo`, `useCallback`, `useMemo` where applicable.
- **Chakra UI:** Generally performant. Avoid excessive re-renders of large component trees.

## 8. Accessibility Considerations (Chakra UI)

Chakra UI components are built with accessibility in mind (ARIA attributes, keyboard navigation).

- Ensure all interactive elements (`Button`, `IconButton`, `Link`, form inputs) have accessible names (e.g., `aria-label` for `IconButton`).
- Manage focus appropriately, especially in modals and interactive canvas elements.

```jsx
// Example of accessible IconButton for Toolbar
// import { IconButton, Text, VStack } from "@chakra-ui/react";
// import { SomeIcon } from "react-icons/fi"; // Example icon
//
// const ToolbarButton = ({ label, icon, isActive, ...props }) => (
//   <VStack spacing={1}>
//     <IconButton
//       aria-label={label}
//       icon={icon}
//       variant="ghost"
//       colorScheme={isActive ? "blue" : "gray"} // Style for active tool
//       borderBottom={isActive ? "2px solid" : "none"}
//       borderColor={isActive ? "blue.500" : "transparent"}
//       {...props}
//     />
//     <Text fontSize="xs" color={isActive ? "blue.500" : "gray.600"}>{label}</Text>
//   </VStack>
// );
```

## 9. Theme System (Chakra UI)

Chakra UI has a robust theming system. Customize it in `src/theme/index.js`.
Refer to `docs/screenshots/dashboard/dashboard.png.md` and `docs/screenshots/canvas/canvas.png.md` for color palettes, fonts, etc.

### A. Theme File (`src/theme/index.js`)

```javascript
// src/theme/index.js
import { extendTheme } from "@chakra-ui/react";

// 1. Define Color Palette (as per .png.md files)
const colors = {
  brand: {
    primary: "#3578E5", // Primary Blue
    // Add other shades if needed: 50, 100, ..., 900
  },
  backgrounds: {
    header: "#F7F9FA", // Canvas Editor Top Nav
    canvasArea: "#FFFFFF",
    dashboardSearch: "#F0F2F5",
    // ... other specific background colors
  },
  textColors: {
    primary: "#000000", // Default text
    secondary: "#6B6B6B", // Subtitles, secondary info
    labels: "#4B4B4B", // Toolbar labels
    // ... other specific text colors
  },
  // Accent pastels for thumbnails/placeholders (can be an array or object)
  accentPastels: ["#E8F4FF", "#FFF1E6", "#F6F9EB" /* ... */],
};

// 2. Define Typography (as per .png.md files)
const fonts = {
  heading: "'Inter', sans-serif", // Example, ensure font is loaded
  body: "'Roboto', sans-serif", // Example, ensure font is loaded
};

const fontSizes = {
  // Define specific font sizes from .png.md
  // e.g., for Dashboard title, Canvas Editor title, subtitles, labels
};

const fontWeights = {
  // Define specific font weights
};

// 3. Component Style Overrides (Optional, for consistent styling)
const components = {
  Button: {
    baseStyle: {
      borderRadius: "4px", // Default for most buttons as per .png.md
      // fontWeight: "medium", // Example
    },
    variants: {
      primaryBlue: {
        // Custom variant for the main blue button
        bg: "brand.primary",
        color: "white",
        _hover: { bg: "blue.600" }, // Darken on hover
      },
      outlineBlue: {
        // Custom variant for share button
        border: "1px solid",
        borderColor: "brand.primary",
        color: "brand.primary",
        bg: "white",
      },
    },
  },
  // ... other component overrides (Input, Card/Box for canvas items, etc.)
};

// 4. Global Styles (Optional)
const styles = {
  global: {
    // 'html, body': {
    //   fontFamily: fonts.body,
    // },
    // a: {
    //   color: 'brand.primary',
    // },
  },
};

// 5. Create the theme
const theme = extendTheme({
  colors,
  fonts,
  fontSizes,
  fontWeights,
  components,
  styles,
  // config: {
  //   initialColorMode: "light", // If dark mode is not a V1 requirement
  //   useSystemColorMode: false,
  // }
});

export default theme;
```

### B. Theme Provider Setup (`src/main.jsx`)

```jsx
// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ChakraProvider } from "@chakra-ui/react";
import { BrowserRouter } from "react-router-dom";
import theme from "./theme"; // Your custom theme
// import './index.css'; // If you have global non-Chakra CSS

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ChakraProvider theme={theme}>
        {/* <ColorModeScript initialColorMode={theme.config.initialColorMode} /> */}
        <App />
      </ChakraProvider>
    </BrowserRouter>
  </React.StrictMode>
);
```

## 10. Additional UI/UX Patterns (Chakra UI Examples)

Adapt patterns using Chakra UI components and styling from `.png.md` files.

### A. Empty States

Use Chakra `Box`, `Image` (for SVG/PNG), `Heading`, `Text`, `Button`.

### B. Navigation & Information Architecture

- **Breadcrumbs:** Use Chakra `Breadcrumb`, `BreadcrumbItem`, `BreadcrumbLink`.
- **App Header:** As described in Dashboard components.

### C. Loading States & Feedback

- **Skeleton Loaders:** Chakra `Skeleton`, `SkeletonText`.
- **Toast Notifications:** Chakra `useToast` hook.

### D. Responsive Design

Chakra UI uses responsive array/object syntax for props (e.g., `width={{ base: '100%', md: '50%' }}`).

## 11. Deployment Considerations

### A. Build Configuration (`vite.config.js`)

If using manual chunks, update for Chakra UI:

```javascript
// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules/@chakra-ui")) {
            return "chakra";
          }
          if (
            id.includes("node_modules/konva") ||
            id.includes("node_modules/react-konva")
          ) {
            return "konva";
          }
          if (id.includes("node_modules/framer-motion")) {
            return "framer-motion";
          }
        },
      },
    },
  },
});
```

### B. Environment Configuration

The `config.js` for environment variables remains conceptually the same.

This updated guide provides a blueprint for Phase 2 development using Chakra UI, React-Konva, and adhering to the detailed visual specifications.

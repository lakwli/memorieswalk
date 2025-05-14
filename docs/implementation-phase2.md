# Phase 2: "My Canvases" Dashboard & Canvas Editor Implementation Details

## 1. Technology Stack & Dependencies

### Core Libraries

```json
{
  "dependencies": {
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "@mui/material": "^5.13.0",
    "@mui/icons-material": "^5.11.16",
    "konva": "^9.0.0",
    "react-konva": "^18.2.8",
    "react-dropzone": "^14.2.3",
    "notistack": "^3.0.1"
  }
}
```

## 2. Component Structure

### A. Directory Layout

```
src/
├── components/
│   ├── dashboard/
│   │   ├── CanvasGrid.jsx
│   │   ├── SearchBar.jsx
│   │   └── ActionsBar.jsx
│   ├── editor/
│   │   ├── KonvaCanvas.jsx
│   │   ├── Toolbar.jsx
│   │   └── ShareModal.jsx
│   └── common/
│       ├── AppHeader.jsx
│       └── LoadingSpinner.jsx
├── pages/
│   ├── DashboardPage.jsx
│   └── CanvasEditorPage.jsx
├── context/
│   └── ThemeContext.jsx
└── hooks/
    └── useCanvas.js
```

### B. Component Implementation Details

#### 1. Dashboard Components

##### CanvasGrid.jsx

```jsx
import { Grid, Card, CardMedia, CardContent, Typography } from "@mui/material";

const CanvasGrid = ({ canvases, onCanvasClick }) => {
  return (
    <Grid container spacing={3}>
      {canvases.map((canvas) => (
        <Grid item xs={12} sm={6} md={4} key={canvas.id}>
          <Card
            onClick={() => onCanvasClick(canvas.id)}
            sx={{
              cursor: "pointer",
              transition: "transform 0.2s",
              "&:hover": { transform: "scale(1.02)" },
            }}
          >
            <CardMedia
              component="img"
              height="140"
              image={canvas.thumbnail_url}
              alt={canvas.title}
            />
            <CardContent>
              <Typography variant="h6">{canvas.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                Last edited: {new Date(canvas.updated_at).toLocaleDateString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};
```

##### SearchBar.jsx

```jsx
import { Paper, InputBase, IconButton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

const SearchBar = ({ onSearch }) => {
  return (
    <Paper
      component="form"
      sx={{ p: "2px 4px", display: "flex", alignItems: "center", width: 400 }}
    >
      <InputBase
        sx={{ ml: 1, flex: 1 }}
        placeholder="Search canvases..."
        onChange={(e) => onSearch(e.target.value)}
      />
      <IconButton type="button" sx={{ p: "10px" }}>
        <SearchIcon />
      </IconButton>
    </Paper>
  );
};
```

#### 2. Canvas Editor Components

##### KonvaCanvas.jsx

```jsx
import { Stage, Layer, Image, Text, Line } from "react-konva";
import { useEffect, useRef } from "react";

const KonvaCanvas = ({ width, height, objects, onObjectsChange, tool }) => {
  const stageRef = useRef(null);

  useEffect(() => {
    // Load saved canvas state
    if (objects) {
      // Implementation of loading objects
    }
  }, [objects]);

  const handleDragEnd = (e) => {
    const id = e.target.id();
    const newObjects = objects.map((obj) =>
      obj.id === id ? { ...obj, x: e.target.x(), y: e.target.y() } : obj
    );
    onObjectsChange(newObjects);
  };

  return (
    <Stage
      width={width}
      height={height}
      ref={stageRef}
      style={{ background: "white" }}
    >
      <Layer>
        {objects.map((obj) => {
          switch (obj.type) {
            case "image":
              return (
                <Image
                  key={obj.id}
                  id={obj.id}
                  {...obj}
                  draggable
                  onDragEnd={handleDragEnd}
                />
              );
            case "text":
              return (
                <Text
                  key={obj.id}
                  id={obj.id}
                  {...obj}
                  draggable
                  onDragEnd={handleDragEnd}
                />
              );
            case "drawing":
              return (
                <Line
                  key={obj.id}
                  id={obj.id}
                  {...obj}
                  draggable
                  onDragEnd={handleDragEnd}
                />
              );
            default:
              return null;
          }
        })}
      </Layer>
    </Stage>
  );
};
```

##### Toolbar.jsx

```jsx
import { Paper, ToggleButtonGroup, ToggleButton } from "@mui/material";
import {
  Upload as UploadIcon,
  TextFields as TextIcon,
  Brush as BrushIcon,
  Rotate90DegreesCcw as RotateIcon,
  Layers as LayersIcon,
} from "@mui/icons-material";

const Toolbar = ({ activeTool, onToolChange }) => {
  return (
    <Paper sx={{ position: "fixed", bottom: 0, width: "100%", p: 2 }}>
      <ToggleButtonGroup
        value={activeTool}
        exclusive
        onChange={onToolChange}
        aria-label="canvas tools"
      >
        <ToggleButton value="upload" aria-label="upload photo">
          <UploadIcon /> Upload
        </ToggleButton>
        <ToggleButton value="text" aria-label="add text">
          <TextIcon /> Text
        </ToggleButton>
        <ToggleButton value="draw" aria-label="draw">
          <BrushIcon /> Draw
        </ToggleButton>
        <ToggleButton value="rotate" aria-label="rotate">
          <RotateIcon /> Rotate
        </ToggleButton>
        <ToggleButton value="layers" aria-label="manage layers">
          <LayersIcon /> Layers
        </ToggleButton>
      </ToggleButtonGroup>
    </Paper>
  );
};
```

### UI COmponents

Core Technologies
For this photo sharing app with canvas editing capabilities, I recommend:

React + Vite as the base framework
React-Konva for the canvas editor
Chakra UI for the UI components (buttons, navigation, modals)
React Router for navigation between screens

### C. Custom Hooks

#### useCanvas.js

```javascript
import { useState, useCallback } from "react";

export const useCanvas = (initialObjects = []) => {
  const [objects, setObjects] = useState(initialObjects);
  const [selectedId, setSelectedId] = useState(null);
  const [tool, setTool] = useState("select");

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
    setObjects((prev) => {
      const index = prev.findIndex((obj) => obj.id === id);
      if (index === -1) return prev;

      const newObjects = [...prev];
      const [movedObj] = newObjects.splice(index, 1);

      if (direction === "forward") {
        newObjects.splice(index + 1, 0, movedObj);
      } else if (direction === "backward") {
        newObjects.splice(Math.max(0, index - 1), 0, movedObj);
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
  };
};
```

## 3. API Integration

### canvasService.js

```javascript
class CanvasService {
  async getCanvases() {
    const response = await fetch("/api/canvases");
    if (!response.ok) throw new Error("Failed to fetch canvases");
    return response.json();
  }

  async saveCanvas(id, canvasData) {
    const response = await fetch(`/api/canvases/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        canvas_data: canvasData,
        thumbnail_url: await this.generateThumbnail(canvasData),
      }),
    });
    if (!response.ok) throw new Error("Failed to save canvas");
    return response.json();
  }

  async generateThumbnail(canvasData) {
    // Implementation of thumbnail generation
    // This could be done via canvas.toDataURL() or a dedicated backend endpoint
  }
}

export const canvasService = new CanvasService();
```

## 4. State Management

### A. Canvas State Structure

```typescript
interface CanvasObject {
  id: string;
  type: "image" | "text" | "drawing";
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  // Type-specific properties
  text?: string;
  fontSize?: number;
  points?: number[]; // For drawings
  imageUrl?: string; // For images
}

interface CanvasState {
  objects: CanvasObject[];
  selectedId: string | null;
  tool: "select" | "upload" | "text" | "draw" | "rotate" | "layers";
}
```

### B. Auto-save Implementation

```javascript
const useAutoSave = (canvasId, objects) => {
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      if (objects.length > 0) {
        canvasService.saveCanvas(canvasId, objects).catch(console.error);
      }
    }, 3000); // Auto-save after 3 seconds of no changes

    return () => clearTimeout(saveTimeout);
  }, [canvasId, objects]);
};
```

## 5. Error Handling & Loading States

### A. Loading States

```jsx
const LoadingSpinner = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="200px"
  >
    <CircularProgress />
  </Box>
);
```

### B. Error Boundary

```jsx
class CanvasErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box textAlign="center" p={4}>
          <Typography variant="h6" color="error">
            Something went wrong with the canvas editor.
          </Typography>
          <Button
            variant="contained"
            onClick={() => window.location.reload()}
            sx={{ mt: 2 }}
          >
            Reload Page
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}
```

## 6. Testing Strategy

### A. Unit Tests

Example test for KonvaCanvas component:

```javascript
import { render, fireEvent } from "@testing-library/react";
import KonvaCanvas from "./KonvaCanvas";

describe("KonvaCanvas", () => {
  it("renders canvas objects correctly", () => {
    const objects = [{ id: "1", type: "text", text: "Test", x: 100, y: 100 }];
    const { container } = render(
      <KonvaCanvas objects={objects} width={800} height={600} />
    );
    expect(container.querySelector("canvas")).toBeInTheDocument();
  });

  // Add more tests for object manipulation, tool interactions, etc.
});
```

### B. Integration Tests

Focus on testing:

- Canvas state management
- Auto-save functionality
- Tool interactions
- API integration
- Error handling

## 7. Performance Optimizations

### A. React-Konva Optimizations

```jsx
// Use transformer for resizing/rotating
const Transformer = ({ selectedId }) => {
  const transformerRef = useRef();
  const selectedRef = useRef();

  useEffect(() => {
    if (selectedId) {
      transformerRef.current.nodes([selectedRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [selectedId]);

  return <Konva.Transformer ref={transformerRef} />;
};

// Implement object caching
const CachedImage = ({ src, ...props }) => {
  const imageRef = useRef();

  useEffect(() => {
    if (imageRef.current) {
      imageRef.current.cache();
    }
  }, [src]);

  return <Image ref={imageRef} src={src} {...props} />;
};
```

### B. Rendering Optimizations

- Use `React.memo` for pure components
- Implement virtualization for large canvases
- Batch updates for multiple object changes

## 8. Accessibility Considerations

### A. ARIA Labels

```jsx
// Example of accessible toolbar button
const ToolbarButton = ({ icon, label, onClick }) => (
  <IconButton onClick={onClick} aria-label={label} role="button" tabIndex={0}>
    {icon}
  </IconButton>
);
```

### B. Keyboard Navigation

```jsx
const KeyboardHandler = ({ onDelete, onCopy, onPaste }) => {
  useEffect(() => {
    const handleKeyboard = (e) => {
      if (e.key === "Delete") onDelete();
      if (e.ctrlKey && e.key === "c") onCopy();
      if (e.ctrlKey && e.key === "v") onPaste();
    };

    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [onDelete, onCopy, onPaste]);

  return null;
};
```

## 9. Theme System

### A. Base Color Palette

```javascript
const baseColors = {
  primary: {
    main: "#2196F3", // Bright blue, good for main actions
    light: "#64B5F6", // Lighter blue for hover states
    dark: "#1976D2", // Darker blue for active states
    contrastText: "#fff", // White text on primary colors
  },
  secondary: {
    main: "#FF4081", // Pink accent for secondary actions
    light: "#FF80AB",
    dark: "#F50057",
    contrastText: "#fff",
  },
  success: {
    main: "#4CAF50", // Green for success states
    light: "#81C784",
    dark: "#388E3C",
  },
  error: {
    main: "#F44336", // Red for error states
    light: "#E57373",
    dark: "#D32F2F",
  },
};
```

### B. Theme Modes

```javascript
// Light Theme
const lightTheme = {
  palette: {
    mode: "light",
    background: {
      default: "#F5F5F5", // Light gray background
      paper: "#FFFFFF", // White surface
      canvas: "#FFFFFF", // White canvas background
    },
    text: {
      primary: "rgba(0, 0, 0, 0.87)",
      secondary: "rgba(0, 0, 0, 0.6)",
      disabled: "rgba(0, 0, 0, 0.38)",
    },
    divider: "rgba(0, 0, 0, 0.12)",
    ...baseColors,
  },
};

// Dark Theme
const darkTheme = {
  palette: {
    mode: "dark",
    background: {
      default: "#121212", // Material dark background
      paper: "#1E1E1E", // Slightly lighter surface
      canvas: "#262626", // Dark but distinguishable canvas
    },
    text: {
      primary: "rgba(255, 255, 255, 0.87)",
      secondary: "rgba(255, 255, 255, 0.6)",
      disabled: "rgba(255, 255, 255, 0.38)",
    },
    divider: "rgba(255, 255, 255, 0.12)",
    ...baseColors,
  },
};
```

### C. Component-Specific Theming

```javascript
const components = {
  MuiCard: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: theme.palette.background.paper,
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: theme.shadows[4],
        },
      }),
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundColor: "transparent",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid",
        borderColor: "divider",
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        textTransform: "none",
        fontWeight: 500,
      },
    },
  },
};
```

### D. Typography

```javascript
const typography = {
  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  h1: {
    fontSize: "2.5rem",
    fontWeight: 600,
  },
  h2: {
    fontSize: "2rem",
    fontWeight: 600,
  },
  h3: {
    fontSize: "1.75rem",
    fontWeight: 600,
  },
  body1: {
    fontSize: "1rem",
    lineHeight: 1.5,
  },
  button: {
    textTransform: "none",
    fontWeight: 500,
  },
};
```

### E. Theme Provider Implementation

```jsx
// src/context/ThemeContext.jsx
import { createContext, useContext, useState, useMemo } from "react";
import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material";

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState("light");

  const theme = useMemo(
    () =>
      createTheme({
        palette: mode === "light" ? lightTheme.palette : darkTheme.palette,
        typography,
        components,
        shape: {
          borderRadius: 8,
        },
        shadows: [
          "none",
          "0px 2px 4px rgba(0,0,0,0.1)",
          // ... custom shadows
        ],
      }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={{ mode, setMode }}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
```

### F. Theme Toggle Component

```jsx
const ThemeToggle = () => {
  const { mode, setMode } = useContext(ThemeContext);

  return (
    <IconButton
      onClick={() => setMode(mode === "light" ? "dark" : "light")}
      color="inherit"
      aria-label="toggle theme"
    >
      {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
    </IconButton>
  );
};
```

### G. Canvas Theme Integration

```javascript
// Custom hook for canvas theme
const useCanvasTheme = () => {
  const theme = useTheme();

  return {
    background: theme.palette.background.canvas,
    gridColor:
      theme.palette.mode === "light"
        ? "rgba(0, 0, 0, 0.1)"
        : "rgba(255, 255, 255, 0.1)",
    objectBorder:
      theme.palette.mode === "light"
        ? "rgba(0, 0, 0, 0.2)"
        : "rgba(255, 255, 255, 0.2)",
    selectionColor: theme.palette.primary.main,
  };
};
```

## 10. Additional UI/UX Patterns

### A. Empty States & First-Time User Experience

```jsx
const EmptyState = () => (
  <Box textAlign="center" py={8}>
    <img src="/empty-state.svg" alt="No canvases yet" />
    <Typography variant="h5" mt={2}>
      Create your first canvas
    </Typography>
    <Typography variant="body1" color="text.secondary" mb={3}>
      Start by clicking the "Create Canvas" button above
    </Typography>
    <Button variant="contained" startIcon={<AddIcon />}>
      Create Canvas
    </Button>
  </Box>
);
```

### B. Navigation & Information Architecture

```jsx
// Breadcrumb Navigation
const Breadcrumbs = () => (
  <MuiBreadcrumbs>
    <Link href="/dashboard">My Canvases</Link>
    <Typography color="text.primary">{currentCanvas.title}</Typography>
  </MuiBreadcrumbs>
);

// App Header with User Context
const AppHeader = () => (
  <AppBar position="sticky">
    <Toolbar>
      <Typography variant="h6" sx={{ flexGrow: 1 }}>
        My Canvases
      </Typography>
      <UserMenu />
      <ThemeToggle />
    </Toolbar>
  </AppBar>
);
```

### C. Loading States & Feedback

```jsx
// Skeleton Loader for Canvas Grid
const CanvasGridSkeleton = () => (
  <Grid container spacing={3}>
    {[1, 2, 3].map((i) => (
      <Grid item xs={12} sm={6} md={4} key={i}>
        <Skeleton variant="rectangular" height={140} />
        <Skeleton variant="text" sx={{ mt: 1 }} />
      </Grid>
    ))}
  </Grid>
);

// Toast Notifications
const useToast = () => {
  const { enqueueSnackbar } = useSnackbar();

  return {
    success: (message) => enqueueSnackbar(message, { variant: "success" }),
    error: (message) => enqueueSnackbar(message, { variant: "error" }),
    info: (message) => enqueueSnackbar(message, { variant: "info" }),
  };
};
```

### D. Progressive Disclosure

```jsx
// Action Hierarchy
const ActionButtons = () => (
  <Stack direction="row" spacing={2}>
    <Button variant="contained" startIcon={<AddIcon />} sx={{ minWidth: 140 }}>
      Create Canvas
    </Button>
    <Button
      variant="outlined"
      startIcon={<DeleteIcon />}
      sx={{ minWidth: 140 }}
    >
      Delete
    </Button>
  </Stack>
);
```

### E. Responsive Design Patterns

```jsx
// Responsive Grid
const useResponsiveGrid = () => ({
  spacing: { xs: 2, sm: 3 },
  columns: { xs: 1, sm: 2, md: 3, lg: 4 },
  itemHeight: { xs: 180, sm: 200, md: 220 },
});

// Responsive Toolbar
const ResponsiveToolbar = () => {
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  return (
    <Toolbar
      sx={{
        flexDirection: isMobile ? "column" : "row",
        gap: isMobile ? 1 : 2,
        p: isMobile ? 1 : 2,
      }}
    >
      {/* Toolbar content */}
    </Toolbar>
  );
};
```

### F. Enhanced Accessibility

```jsx
// Focus Management
const useFocusManagement = () => {
  const focusRef = useRef(null);
  useEffect(() => {
    if (focusRef.current) {
      focusRef.current.focus();
    }
  }, []);
  return focusRef;
};

// Screen Reader Announcements
const useAnnounce = () => {
  const announce = (message) => {
    const element = document.createElement("div");
    element.setAttribute("aria-live", "polite");
    element.textContent = message;
    document.body.appendChild(element);
    setTimeout(() => document.body.removeChild(element), 1000);
  };
  return announce;
};

// Enhanced Tooltips
const ToolbarTooltip = ({ title, children }) => (
  <Tooltip title={title} placement="top" enterDelay={500} arrow>
    {children}
  </Tooltip>
);
```

### G. Performance Patterns

```jsx
// Lazy Loading Grid
const LazyCanvasGrid = () => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 12 });
  const observerRef = useInfiniteScroll(loadMore);

  return (
    <div ref={observerRef}>
      <Grid container spacing={3}>
        {canvases.slice(visibleRange.start, visibleRange.end).map((canvas) => (
          <CanvasCard key={canvas.id} canvas={canvas} />
        ))}
      </Grid>
    </div>
  );
};

// Selection Feedback
const useSelectionFeedback = () => {
  return {
    strokeWidth: 2,
    stroke: theme.palette.primary.main,
    dash: [4, 4],
    cornerRadius: 5,
    borderRadius: 0,
    padding: 10,
  };
};
```

## 11. Deployment Considerations

### A. Build Configuration

```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          konva: ["konva", "react-konva"],
          mui: ["@mui/material", "@mui/icons-material"],
        },
      },
    },
  },
});
```

### B. Environment Configuration

```javascript
// config.js
export const config = {
  apiUrl: import.meta.env.VITE_API_URL,
  maxCanvasSize: import.meta.env.VITE_MAX_CANVAS_SIZE || 4096,
  autoSaveInterval: import.meta.env.VITE_AUTO_SAVE_INTERVAL || 3000,
};
```

This implementation guide provides a detailed blueprint for Phase 2 development, focusing on the technical implementation details of the dashboard and canvas editor components. The guide emphasizes code quality, performance, accessibility, and maintainability while adhering to React best practices and modern web development standards.

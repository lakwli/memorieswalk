// src/theme/index.js
import { extendTheme } from "@chakra-ui/react";

// 1. Define Color Palette (as per .png.md files)
const colors = {
  brand: {
    50: "#e3f2fd",
    100: "#bbdefb",
    500: "#3578E5", // Primary blue from mockups
    600: "#2961c9",
    700: "#1e4baf",
  },
  backgrounds: {
    app: "#FFFFFF",
    header: "#F7F9FA", // Canvas Editor Top Nav background from canvas.png.md
    canvasArea: "#FFFFFF", // Canvas area background from canvas.png.md
    dashboardSearch: "#F0F2F5", // Dashboard search bar background from dashboard.png.md
    dashboardCard: "#FFFFFF", // Default for cards, can be overridden by pastel accents
    toolbarTranslucent: "rgba(255, 255, 255, 0.9)", // Editor toolbar from canvas.png.md
  },
  textColors: {
    primary: "#1A202C", // Chakra's default dark gray, good starting point
    secondary: "#6B6B6B", // Subtitles, secondary info from canvas.png.md
    labels: "#4B4B4B", // Toolbar labels from canvas.png.md
    link: "#3578E5", // For links like "View All"
    buttonLight: "#FFFFFF", // Text on dark/colored buttons
    canvasTitle: "#000000", // Assuming black or very dark gray for main titles
    dashboardCanvasTitle: "#333333", // "Travel 2024" on dashboard card
  },
  borders: {
    light: "#E2E8F0", // Chakra's gray.200, good for subtle borders
    searchBar: "#F0F2F5", // dashboard.png.md (same as background, or slightly darker if needed)
    buttonOutline: "#3578E5", // Share button outline
  },
  // Accent pastels for thumbnails/placeholders (can be an array or object)
  // From canvas.png.md: #E8F4FF, #FFF1E6, #F6F9EB
  // From dashboard.jsx.code (example): #f0f5f9, #e9f7ef, #fff3e0, #fce4ec, #e1f5fe, #e0f2f1
  accentPastels: {
    blue: "#E8F4FF",
    orange: "#FFF1E6",
    green: "#F6F9EB",
    lightBlue: "#e1f5fe",
    lightGreen: "#e0f2f1",
    pink: "#fce4ec",
    grayish: "#f0f5f9",
  },
};

// 2. Define Typography (as per .png.md files)
// Ensure these fonts are loaded in your public/index.html or via a CSS import
const fonts = {
  heading: "Inter, system-ui, sans-serif",
  body: "Inter, system-ui, sans-serif",
};

// Specific text styles can be defined in components or as component style overrides
// For example, Dashboard Title: bold 24px
// Canvas Editor Title: bold 20px
// Subtitles: 14px
// Labels: 12px

// 3. Component Style Overrides (Optional, for consistent styling)
const components = {
  Button: {
    baseStyle: {
      borderRadius: "4px", // Default for most buttons as per .png.md
      fontWeight: "medium",
    },
    variants: {
      // "Create Canvas" button style from dashboard.png.md
      createCanvas: {
        bg: "brand.primary",
        color: "textColors.buttonLight",
        height: "48px",
        fontSize: "16px",
        _hover: { bg: "blue.600" }, // Chakra's blue.600 is a darker shade
      },
      // "Save" button style from canvas.png.md
      saveCanvas: {
        bg: "brand.primary",
        color: "textColors.buttonLight",
        fontSize: "14px",
        padding: "8px 16px",
        _hover: { bg: "blue.600" },
      },
      // "Share" button style from canvas.png.md
      shareCanvas: {
        bg: "backgrounds.canvasArea", // white
        color: "brand.primary",
        borderColor: "borders.buttonOutline",
        borderWidth: "1px",
        fontSize: "14px",
        padding: "8px 16px",
        _hover: { bg: "gray.100" }, // Slight darken on hover
      },
    },
    defaultProps: {
      colorScheme: "brand",
    },
  },
  Heading: {
    baseStyle: {
      fontFamily: fonts.heading,
    },
  },
  Text: {
    baseStyle: {
      fontFamily: fonts.body,
    },
  },
  Input: {
    // For Search Bar
    variants: {
      dashboardSearch: {
        field: {
          bg: "backgrounds.dashboardSearch",
          borderColor: "borders.searchBar", // or transparent if bg is enough
          borderRadius: "4px", // from dashboard.png.md
          _placeholder: { color: "gray.500" },
        },
      },
      outline: {
        field: {
          _focus: {
            borderColor: "brand.500",
            boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)",
          },
        },
      },
    },
  },
  // Add overrides for Card (Box for canvas items), Link, Avatar etc. if needed
  // to match .png.md specifics more easily globally.
};

// 4. Global Styles (Optional)
const styles = {
  global: {
    "html, body": {
      fontFamily: fonts.body,
      color: "textColors.primary",
      bg: "backgrounds.app",
      lineHeight: "tall",
    },
    a: {
      color: "textColors.link",
    },
  },
};

// 5. Create the theme
const theme = extendTheme({
  colors,
  fonts,
  components,
  styles,
  config: {
    initialColorMode: "light", // As per current design (no dark mode specified yet)
    useSystemColorMode: false,
  },
});

export default theme;

// src/theme/index.js
import { extendTheme } from "@chakra-ui/react";

// 1. Define Color Palette (as per .png.md files)
const colors = {
  brand: {
    50: "#E8F4FF",
    100: "#C9E2FF",
    200: "#90C2FF",
    300: "#64A8FF",
    400: "#4593FC",
    500: "#3578E5", // Primary brand color
    600: "#2961C9",
    700: "#1E4BAF",
    800: "#173A8C",
    900: "#102A6A",
  },
  backgrounds: {
    app: "#FFFFFF",
    header: "#F7F9FA", // Canvas Editor Top Nav background from canvas.png.md
    footer: "#F7F9FA", // Added footer background
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
const fonts = {
  heading: "'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
  body: "'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
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
      fontWeight: "500",
      borderRadius: "8px",
      _focus: {
        boxShadow: "0 0 0 3px rgba(66, 153, 225, 0.6)",
      },
    },
    variants: {
      solid: {
        bg: "brand.500",
        color: "white",
        _hover: { bg: "brand.600" },
        _active: { bg: "brand.700" },
      },
      outline: {
        borderColor: "brand.500",
        color: "brand.500",
        _hover: { bg: "brand.50" },
      },
      createCanvas: {
        bg: "brand.primary",
        color: "textColors.buttonLight",
        height: "48px",
        fontSize: "16px",
        _hover: { bg: "blue.600" }, // Chakra's blue.600 is a darker shade
      },
      saveCanvas: {
        bg: "brand.primary",
        color: "textColors.buttonLight",
        fontSize: "14px",
        padding: "8px 16px",
        _hover: { bg: "blue.600" },
      },
      shareCanvas: {
        bg: "backgrounds.canvasArea", // white
        color: "brand.primary",
        borderColor: "borders.buttonOutline",
        borderWidth: "1px",
        fontSize: "14px",
        padding: "8px 16px",
        _hover: { bg: "gray.100" }, // Slight darken on hover
      },

      // === STANDARDIZED SEMANTIC VARIANTS ===
      // These can be used across dialogs, forms, notifications, etc.

      // Secondary/Cancel actions (low visual weight)
      secondary: {
        bg: "transparent",
        color: "gray.700",
        border: "1px solid",
        borderColor: "gray.300",
        _hover: {
          bg: "gray.50",
          borderColor: "gray.400",
        },
        _active: { bg: "gray.100" },
        _focus: {
          boxShadow: "0 0 0 3px rgba(160, 174, 192, 0.3)",
        },
      },

      // Alternative secondary style (even less visual weight)
      ghost: {
        bg: "transparent",
        color: "gray.600",
        _hover: {
          bg: "gray.100",
          color: "gray.700",
        },
        _active: { bg: "gray.150" },
        _focus: {
          boxShadow: "0 0 0 3px rgba(160, 174, 192, 0.3)",
        },
      },

      // Primary positive actions (confirmations, saves, submissions)
      primary: {
        bg: "brand.500",
        color: "white",
        _hover: { bg: "brand.600" },
        _active: { bg: "brand.700" },
        _focus: {
          boxShadow: "0 0 0 3px rgba(53, 120, 229, 0.3)",
        },
      },

      // Danger/Error actions (delete, remove, cancel operations)
      danger: {
        bg: "red.500",
        color: "white",
        _hover: { bg: "red.600" },
        _active: { bg: "red.700" },
        _focus: {
          boxShadow: "0 0 0 3px rgba(245, 101, 101, 0.3)",
        },
      },

      // Warning actions (proceed with caution)
      warning: {
        bg: "orange.500",
        color: "white",
        _hover: { bg: "orange.600" },
        _active: { bg: "orange.700" },
        _focus: {
          boxShadow: "0 0 0 3px rgba(251, 146, 60, 0.3)",
        },
      },

      // Success actions (completed states, positive confirmations)
      success: {
        bg: "green.500",
        color: "white",
        _hover: { bg: "green.600" },
        _active: { bg: "green.700" },
        _focus: {
          boxShadow: "0 0 0 3px rgba(72, 187, 120, 0.3)",
        },
      },

      // === CONTEXT-SPECIFIC VARIANTS ===
      // These use the semantic variants above but with specific sizing/spacing

      // Dialog buttons (consistent sizing for all dialogs)
      dialogSecondary: {
        bg: "transparent",
        color: "gray.700",
        border: "1px solid",
        borderColor: "gray.300",
        minW: "80px",
        _hover: {
          bg: "gray.50",
          borderColor: "gray.400",
        },
        _active: { bg: "gray.100" },
        _focus: {
          boxShadow: "0 0 0 3px rgba(160, 174, 192, 0.3)",
        },
      },

      dialogPrimary: {
        bg: "brand.500",
        color: "white",
        minW: "80px",
        _hover: { bg: "brand.600" },
        _active: { bg: "brand.700" },
        _focus: {
          boxShadow: "0 0 0 3px rgba(53, 120, 229, 0.3)",
        },
      },

      dialogDanger: {
        bg: "red.500",
        color: "white",
        minW: "80px",
        _hover: { bg: "red.600" },
        _active: { bg: "red.700" },
        _focus: {
          boxShadow: "0 0 0 3px rgba(245, 101, 101, 0.3)",
        },
      },
    },
    defaultProps: {
      colorScheme: "brand",
    },
  },
  Heading: {
    baseStyle: {
      fontWeight: "600",
      color: "gray.900",
      fontFamily: fonts.heading,
    },
  },
  Text: {
    baseStyle: {
      color: "gray.700",
      fontFamily: fonts.body,
    },
  },
  Input: {
    variants: {
      outline: {
        field: {
          borderRadius: "8px",
          borderColor: "gray.200",
          _hover: { borderColor: "gray.300" },
          _focus: {
            borderColor: "brand.500",
            boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)",
          },
        },
      },
      filled: {
        field: {
          borderRadius: "8px",
          bg: "gray.50",
          _hover: { bg: "gray.100" },
          _focus: {
            bg: "white",
            borderColor: "brand.500",
          },
        },
      },
      dashboardSearch: {
        field: {
          bg: "backgrounds.dashboardSearch",
          borderColor: "borders.searchBar", // or transparent if bg is enough
          borderRadius: "4px", // from dashboard.png.md
          _placeholder: { color: "gray.500" },
        },
      },
    },
  },
  Link: {
    baseStyle: {
      color: "brand.500",
      _hover: {
        textDecoration: "none",
        color: "brand.600",
      },
    },
  },
  Card: {
    baseStyle: {
      container: {
        borderRadius: "12px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
      },
    },
  },
  Container: {
    baseStyle: {
      maxW: "1280px",
      px: { base: 4, md: 6, lg: 8 },
    },
  },
};

// 4. Global Styles (Optional)
const styles = {
  global: {
    "html, body": {
      color: "gray.900",
      lineHeight: "tall",
      bg: "gray.50",
      fontFamily: fonts.body,
    },
    "::selection": {
      backgroundColor: "brand.100",
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

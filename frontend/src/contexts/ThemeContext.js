import React, { createContext, useContext, useReducer, useEffect } from "react";

// Create Theme Context
const ThemeContext = createContext();

// Theme Actions
const THEME_ACTIONS = {
  TOGGLE_THEME: "TOGGLE_THEME",
  SET_THEME: "SET_THEME",
  SET_SIDEBAR_OPEN: "SET_SIDEBAR_OPEN",
  TOGGLE_SIDEBAR: "TOGGLE_SIDEBAR",
  SET_MOBILE_MENU_OPEN: "SET_MOBILE_MENU_OPEN",
  TOGGLE_MOBILE_MENU: "TOGGLE_MOBILE_MENU",
  SET_LOADING: "SET_LOADING",
  SET_NOTIFICATION_SETTINGS: "SET_NOTIFICATION_SETTINGS",
};

// Professional Color Palette
const colorPalette = {
  light: {
    primary: {
      50: "#f0f9ff",
      100: "#e0f2fe",
      200: "#bae6fd",
      300: "#7dd3fc",
      400: "#38bdf8",
      500: "#0ea5e9",
      600: "#0284c7",
      700: "#0369a1",
      800: "#075985",
      900: "#0c4a6e",
      main: "#0ea5e9",
      dark: "#0369a1",
      light: "#38bdf8",
    },
    secondary: {
      50: "#fdf4ff",
      100: "#fae8ff",
      200: "#f5d0fe",
      300: "#f0abfc",
      400: "#e879f9",
      500: "#d946ef",
      600: "#c026d3",
      700: "#a21caf",
      800: "#86198f",
      900: "#701a75",
      main: "#d946ef",
      dark: "#a21caf",
      light: "#e879f9",
    },
    success: {
      50: "#f0fdf4",
      500: "#22c55e",
      600: "#16a34a",
      main: "#22c55e",
    },
    warning: {
      50: "#fffbeb",
      500: "#f59e0b",
      600: "#d97706",
      main: "#f59e0b",
    },
    error: {
      50: "#fef2f2",
      500: "#ef4444",
      600: "#dc2626",
      main: "#ef4444",
    },
    background: {
      default: "#fafafa",
      paper: "#ffffff",
      elevated: "#ffffff",
    },
    text: {
      primary: "#1f2937",
      secondary: "#6b7280",
      disabled: "#9ca3af",
    },
    divider: "#e5e7eb",
    shadow: {
      sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
      xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    },
  },
  dark: {
    primary: {
      50: "#0c4a6e",
      100: "#075985",
      200: "#0369a1",
      300: "#0284c7",
      400: "#0ea5e9",
      500: "#38bdf8",
      600: "#7dd3fc",
      700: "#bae6fd",
      800: "#e0f2fe",
      900: "#f0f9ff",
      main: "#38bdf8",
      dark: "#0284c7",
      light: "#7dd3fc",
    },
    secondary: {
      50: "#701a75",
      100: "#86198f",
      200: "#a21caf",
      300: "#c026d3",
      400: "#d946ef",
      500: "#e879f9",
      600: "#f0abfc",
      700: "#f5d0fe",
      800: "#fae8ff",
      900: "#fdf4ff",
      main: "#e879f9",
      dark: "#c026d3",
      light: "#f0abfc",
    },
    success: {
      50: "#064e3b",
      500: "#10b981",
      600: "#059669",
      main: "#10b981",
    },
    warning: {
      50: "#78350f",
      500: "#f59e0b",
      600: "#d97706",
      main: "#f59e0b",
    },
    error: {
      50: "#7f1d1d",
      500: "#f87171",
      600: "#ef4444",
      main: "#f87171",
    },
    background: {
      default: "#0f172a",
      paper: "#1e293b",
      elevated: "#334155",
    },
    text: {
      primary: "#f8fafc",
      secondary: "#cbd5e1",
      disabled: "#64748b",
    },
    divider: "#334155",
    shadow: {
      sm: "0 1px 2px 0 rgb(0 0 0 / 0.3)",
      md: "0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)",
      lg: "0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.3)",
      xl: "0 20px 25px -5px rgb(0 0 0 / 0.3), 0 8px 10px -6px rgb(0 0 0 / 0.3)",
    },
  },
};

// Initial State
const initialState = {
  theme: "light", // 'light' or 'dark'
  sidebarOpen: true,
  mobileMenuOpen: false,
  isLoading: false,
  colorPalette,
  notifications: {
    sound: true,
    desktop: true,
    email: true,
    push: false,
  },
  preferences: {
    language: "en",
    currency: "NGN",
    timezone: "Africa/Lagos",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12h",
  },
};

// Theme Reducer
const themeReducer = (state, action) => {
  switch (action.type) {
    case THEME_ACTIONS.TOGGLE_THEME:
      return {
        ...state,
        theme: state.theme === "light" ? "dark" : "light",
      };

    case THEME_ACTIONS.SET_THEME:
      return {
        ...state,
        theme: action.payload,
      };

    case THEME_ACTIONS.SET_SIDEBAR_OPEN:
      return {
        ...state,
        sidebarOpen: action.payload,
      };

    case THEME_ACTIONS.TOGGLE_SIDEBAR:
      return {
        ...state,
        sidebarOpen: !state.sidebarOpen,
      };

    case THEME_ACTIONS.SET_MOBILE_MENU_OPEN:
      return {
        ...state,
        mobileMenuOpen: action.payload,
      };

    case THEME_ACTIONS.TOGGLE_MOBILE_MENU:
      return {
        ...state,
        mobileMenuOpen: !state.mobileMenuOpen,
      };

    case THEME_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case THEME_ACTIONS.SET_NOTIFICATION_SETTINGS:
      return {
        ...state,
        notifications: {
          ...state.notifications,
          ...action.payload,
        },
      };

    default:
      return state;
  }
};

// Theme Provider Component
export const ThemeProvider = ({ children }) => {
  const [state, dispatch] = useReducer(themeReducer, initialState);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const savedSidebarState = localStorage.getItem("sidebarOpen");
    const savedNotifications = localStorage.getItem("notifications");
    const savedPreferences = localStorage.getItem("preferences");

    if (savedTheme) {
      dispatch({ type: THEME_ACTIONS.SET_THEME, payload: savedTheme });
    } else {
      // Check system preference
      const systemPrefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      dispatch({
        type: THEME_ACTIONS.SET_THEME,
        payload: systemPrefersDark ? "dark" : "light",
      });
    }

    if (savedSidebarState !== null) {
      dispatch({
        type: THEME_ACTIONS.SET_SIDEBAR_OPEN,
        payload: JSON.parse(savedSidebarState),
      });
    }

    if (savedNotifications) {
      dispatch({
        type: THEME_ACTIONS.SET_NOTIFICATION_SETTINGS,
        payload: JSON.parse(savedNotifications),
      });
    }

    if (savedPreferences) {
      const preferences = JSON.parse(savedPreferences);
      // Update state with saved preferences (you might want to add a specific action for this)
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;

    if (state.theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Save to localStorage
    localStorage.setItem("theme", state.theme);
  }, [state.theme]);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(state.sidebarOpen));
  }, [state.sidebarOpen]);

  // Save notification settings to localStorage
  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(state.notifications));
  }, [state.notifications]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e) => {
      // Only auto-switch if user hasn't manually set a preference
      const savedTheme = localStorage.getItem("theme");
      if (!savedTheme) {
        dispatch({
          type: THEME_ACTIONS.SET_THEME,
          payload: e.matches ? "dark" : "light",
        });
      }
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Close mobile menu when window is resized to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && state.mobileMenuOpen) {
        dispatch({ type: THEME_ACTIONS.SET_MOBILE_MENU_OPEN, payload: false });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [state.mobileMenuOpen]);

  // Theme actions
  const toggleTheme = () => {
    dispatch({ type: THEME_ACTIONS.TOGGLE_THEME });
  };

  const setTheme = (theme) => {
    dispatch({ type: THEME_ACTIONS.SET_THEME, payload: theme });
  };

  const setSidebarOpen = (isOpen) => {
    dispatch({ type: THEME_ACTIONS.SET_SIDEBAR_OPEN, payload: isOpen });
  };

  const toggleSidebar = () => {
    dispatch({ type: THEME_ACTIONS.TOGGLE_SIDEBAR });
  };

  const setMobileMenuOpen = (isOpen) => {
    dispatch({ type: THEME_ACTIONS.SET_MOBILE_MENU_OPEN, payload: isOpen });
  };

  const toggleMobileMenu = () => {
    dispatch({ type: THEME_ACTIONS.TOGGLE_MOBILE_MENU });
  };

  const setLoading = (isLoading) => {
    dispatch({ type: THEME_ACTIONS.SET_LOADING, payload: isLoading });
  };

  const updateNotificationSettings = (settings) => {
    dispatch({
      type: THEME_ACTIONS.SET_NOTIFICATION_SETTINGS,
      payload: settings,
    });
  };

  // Helper functions
  const isDark = () => state.theme === "dark";
  const isLight = () => state.theme === "light";
  const isMobile = () => window.innerWidth < 768;
  const isTablet = () => window.innerWidth >= 768 && window.innerWidth < 1024;
  const isDesktop = () => window.innerWidth >= 1024;

  // Theme colors (you can expand this based on your design system)
  const colors = {
    primary: {
      50: "#eff6ff",
      100: "#dbeafe",
      200: "#bfdbfe",
      300: "#93c5fd",
      400: "#60a5fa",
      500: "#3b82f6",
      600: "#2563eb",
      700: "#1d4ed8",
      800: "#1e40af",
      900: "#1e3a8a",
    },
    success: {
      50: "#f0fdf4",
      100: "#dcfce7",
      200: "#bbf7d0",
      300: "#86efac",
      400: "#4ade80",
      500: "#22c55e",
      600: "#16a34a",
      700: "#15803d",
      800: "#166534",
      900: "#14532d",
    },
    warning: {
      50: "#fffbeb",
      100: "#fef3c7",
      200: "#fde68a",
      300: "#fcd34d",
      400: "#fbbf24",
      500: "#f59e0b",
      600: "#d97706",
      700: "#b45309",
      800: "#92400e",
      900: "#78350f",
    },
    error: {
      50: "#fef2f2",
      100: "#fee2e2",
      200: "#fecaca",
      300: "#fca5a5",
      400: "#f87171",
      500: "#ef4444",
      600: "#dc2626",
      700: "#b91c1c",
      800: "#991b1b",
      900: "#7f1d1d",
    },
  };

  const value = {
    // State
    theme: state.theme,
    sidebarOpen: state.sidebarOpen,
    mobileMenuOpen: state.mobileMenuOpen,
    isLoading: state.isLoading,
    notifications: state.notifications,
    preferences: state.preferences,
    colors,

    // Actions
    toggleTheme,
    setTheme,
    setSidebarOpen,
    toggleSidebar,
    setMobileMenuOpen,
    toggleMobileMenu,
    setLoading,
    updateNotificationSettings,

    // Helper functions
    isDark,
    isLight,
    isMobile,
    isTablet,
    isDesktop,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};

export default ThemeContext;

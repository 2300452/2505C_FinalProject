import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function buildTheme(mode) {
  const isPatient = mode === "patient";

  const palette = isPatient
    ? {
        primary: "#e89b55",
        primarySoft: "#fff0e2",
        secondary: "#f3b27a",
        background: "#fff8f1",
        surface: "#fffdf9",
        border: "#f2dcc8",
        sidebar: "#f4c59a",
        sidebarDark: "#e7a86c",
        sidebarText: "#5f3a16",
        heading: "#7a4a1e",
      }
    : {
        primary: "#7eb8d9",
        primarySoft: "#eef7fc",
        secondary: "#9ac9e4",
        background: "#f5fbff",
        surface: "#ffffff",
        border: "#dceaf2",
        sidebar: "#d9ecf7",
        sidebarDark: "#8fbcd6",
        sidebarText: "#22465f",
        heading: "#29506b",
      };

  return createTheme({
    palette: {
      mode: "light",
      primary: { main: palette.primary },
      secondary: { main: palette.secondary },
      background: {
        default: palette.background,
        paper: palette.surface,
      },
      text: {
        primary: "#243746",
        secondary: "#6a7b86",
      },
      divider: palette.border,
      custom: palette,
    },
    shape: {
      borderRadius: 16,
    },
    typography: {
      fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
      h4: {
        fontWeight: 700,
        color: palette.heading,
      },
      h5: {
        fontWeight: 700,
      },
      h6: {
        fontWeight: 700,
      },
      button: {
        textTransform: "none",
        fontWeight: 700,
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            background: `linear-gradient(180deg, ${palette.background} 0%, #ffffff 100%)`,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: "0 10px 30px rgba(27, 52, 76, 0.06)",
            border: `1px solid ${palette.border}`,
            backgroundColor: palette.surface,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 16,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            paddingInline: 18,
          },
          contained: {
            boxShadow: "none",
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: "outlined",
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: "#ffffff",
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            height: 3,
            borderRadius: 3,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 700,
            color: palette.heading,
            backgroundColor: palette.primarySoft,
          },
        },
      },
    },
  });
}

function AppThemeProvider({ children }) {
  const location = useLocation();
  const { user } = useAuth();

  const mode = useMemo(() => {
    if (user?.role === "Patient" || location.pathname.startsWith("/patient")) {
      return "patient";
    }
    return "staff";
  }, [location.pathname, user?.role]);

  const theme = useMemo(() => buildTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

export default AppThemeProvider;

import { Box, useTheme } from "@mui/material";
import Sidebar from "./Sidebar";

function Layout({ children }) {
  const theme = useTheme();
  const shell = theme.palette.custom;

  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar />
      <Box
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          bgcolor: "transparent",
          minHeight: "100vh",
          background: `linear-gradient(180deg, ${shell.primarySoft} 0%, ${theme.palette.background.default} 45%, #ffffff 100%)`,
        }}
      >
        <Box
          sx={{
            maxWidth: 1280,
            mx: "auto",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export default Layout;

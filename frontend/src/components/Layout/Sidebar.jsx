import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import MedicalServicesOutlinedIcon from "@mui/icons-material/MedicalServicesOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import { Avatar, Box, Button, Stack, Typography, useTheme } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const shell = theme.palette.custom;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const adminLinks = [
    { label: "Dashboard", to: "/admin/dashboard", icon: <DashboardOutlinedIcon fontSize="small" /> },
    { label: "Create Staff", to: "/admin/create-user", icon: <PersonAddAltOutlinedIcon fontSize="small" /> },
    { label: "Manage Users", to: "/admin/users", icon: <GroupOutlinedIcon fontSize="small" /> },
  ];

  const doctorLinks = [
    { label: "Dashboard", to: "/doctor/dashboard", icon: <DashboardOutlinedIcon fontSize="small" /> },
    { label: "Patients", to: "/doctor/patients", icon: <MedicalServicesOutlinedIcon fontSize="small" /> },
    { label: "Appointments", to: "/doctor/appointments", icon: <GroupOutlinedIcon fontSize="small" /> },
    { label: "Alerts", to: "/doctor/alerts", icon: <UploadFileOutlinedIcon fontSize="small" /> },
    { label: "My Profile", to: "/doctor/profile", icon: <PersonOutlineOutlinedIcon fontSize="small" /> },
  ];

  const patientLinks = [
    { label: "Dashboard", to: "/patient/dashboard", icon: <DashboardOutlinedIcon fontSize="small" /> },
    { label: "Profile", to: "/patient/profile", icon: <PersonOutlineOutlinedIcon fontSize="small" /> },
    { label: "Upload Assessment", to: "/patient/upload", icon: <UploadFileOutlinedIcon fontSize="small" /> },
    { label: "Medical Records", to: "/patient/records", icon: <DescriptionOutlinedIcon fontSize="small" /> },
    { label: "Book Appointment", to: "/patient/book-appointment", icon: <EventAvailableOutlinedIcon fontSize="small" /> },
    { label: "My Appointments", to: "/patient/appointments", icon: <GroupOutlinedIcon fontSize="small" /> },
  ];

  const links =
    user?.role === "Admin" ? adminLinks : user?.role === "Doctor" ? doctorLinks : patientLinks;

  return (
    <Box
      sx={{
        width: 250,
        minHeight: "100vh",
        bgcolor: shell.sidebar,
        color: shell.sidebarText,
        display: "flex",
        flexDirection: "column",
        borderRight: `1px solid ${shell.border}`,
      }}
    >
      <Box sx={{ px: 3, py: 2.5, bgcolor: shell.sidebarDark }}>
        <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 0.5, color: shell.sidebarText }}>
          {user?.role === "Admin" ? "Health Admin" : "Patient Buddy"}
        </Typography>
      </Box>

      {user && (
        <Box
          sx={{
            px: 2.5,
            py: 2.5,
            bgcolor: shell.primarySoft,
            borderBottom: `1px solid ${shell.border}`,
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: shell.primary, color: "#ffffff", fontWeight: 700 }}>
              {user.name?.[0] || "U"}
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, color: shell.heading }}>
                Welcome
              </Typography>
              <Typography variant="caption" sx={{ color: shell.sidebarText, display: "block" }}>
                {user.name}
              </Typography>
              <Typography variant="caption" sx={{ color: shell.sidebarText, opacity: 0.8 }}>
                {user.generatedId}
              </Typography>
            </Box>
          </Stack>
        </Box>
      )}

      <Box sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 0.5 }}>
        {links.map((link) => (
          <Button
            key={link.to}
            component={Link}
            to={link.to}
            fullWidth
            startIcon={link.icon}
            sx={{
              color: shell.sidebarText,
              justifyContent: "flex-start",
              px: 1.5,
              py: 1.25,
              borderRadius: 1,
              textTransform: "none",
              "&:hover": {
                bgcolor: shell.primarySoft,
              },
            }}
          >
            {link.label}
          </Button>
        ))}
      </Box>

      <Button
        onClick={handleLogout}
        fullWidth
        startIcon={<LogoutOutlinedIcon fontSize="small" />}
        sx={{
          mt: "auto",
          mb: 2,
          mx: 1.5,
          color: shell.sidebarText,
          justifyContent: "flex-start",
          textTransform: "none",
        }}
      >
        Logout
      </Button>
    </Box>
  );
}

export default Sidebar;

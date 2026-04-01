import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  TextField,
  Typography,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

function Login({ portal = "staff" }) {
  const [form, setForm] = useState({
    email: "",
    password: "",
    portal,
  });
  const [message, setMessage] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forceChangeMode, setForceChangeMode] = useState(false);

  const navigate = useNavigate();
  const { login, logout, changeOwnPassword } = useAuth();

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const loggedInUser = await login(form);

      if (loggedInUser.mustChangePassword) {
        setForceChangeMode(true);
        setMessage("You must change your password before continuing.");
        return;
      }

      if (loggedInUser.role === "Admin") navigate("/admin/dashboard");
      if (loggedInUser.role === "Doctor") navigate("/doctor/dashboard");
      if (loggedInUser.role === "Patient") navigate("/patient/dashboard");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleForcedPasswordChange = async (e) => {
    e.preventDefault();

    if (!newPassword.trim() || newPassword.length < 6) {
      setMessage("Please enter a new password with at least 6 characters.");
      return;
    }

    await changeOwnPassword(newPassword);
    logout();
    setForceChangeMode(false);
    setMessage("Password updated. Please log in again.");
    setForm({
      email: "",
      password: "",
      portal,
    });
    setNewPassword("");
  };

  const isStaff = portal === "staff";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        py: 6,
      }}
    >
      <Container maxWidth="md">
        <Card sx={{ borderRadius: 5 }}>
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Typography variant="h3" gutterBottom sx={{ fontWeight: 800 }}>
              {isStaff ? "Staff Login" : "Patient Login"}
            </Typography>

            <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
              {isStaff
                ? "Secure sign in for doctors and admins"
                : "Welcome back. Sign in to view your appointments and assessments."}
            </Typography>

            {isStaff && (
              <Typography variant="body1" sx={{ mb: 3, color: "text.secondary" }}>
                Breakglass root admin account:
                <br />
                <strong>Email:</strong> admin@patientbuddy.com
                <br />
                <strong>Password:</strong> Admin123!
              </Typography>
            )}

            {message && (
              <Alert severity={forceChangeMode ? "warning" : "error"} sx={{ mb: 2 }}>
                {message}
              </Alert>
            )}

            {!forceChangeMode ? (
              <Box component="form" onSubmit={handleLogin}>
                <TextField
                  label="Email"
                  name="email"
                  fullWidth
                  margin="normal"
                  value={form.email}
                  onChange={handleChange}
                  sx={{ "& .MuiInputBase-input": { fontSize: 18, py: 1.2 } }}
                />

                <TextField
                  label="Password"
                  name="password"
                  type="password"
                  fullWidth
                  margin="normal"
                  value={form.password}
                  onChange={handleChange}
                  sx={{ "& .MuiInputBase-input": { fontSize: 18, py: 1.2 } }}
                />

                <Button type="submit" variant="contained" fullWidth size="large" sx={{ mt: 3, py: 1.5, fontSize: 18 }}>
                  Login
                </Button>

                <Button
                  component={Link}
                  to={`/forgot-password?portal=${portal}`}
                  variant="text"
                  fullWidth
                  sx={{ mt: 1.5, fontSize: 16 }}
                >
                  Forgot Password
                </Button>

                {!isStaff && (
                  <Button
                    component={Link}
                    to="/signup"
                    variant="text"
                    fullWidth
                    sx={{ mt: 1, fontSize: 16 }}
                  >
                    Patient Sign Up
                  </Button>
                )}

                <Button component={Link} to="/" variant="text" fullWidth sx={{ mt: 1, fontSize: 16 }}>
                  Back
                </Button>
              </Box>
            ) : (
              <Box component="form" onSubmit={handleForcedPasswordChange}>
                <TextField
                  label="New Password"
                  type="password"
                  fullWidth
                  margin="normal"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  sx={{ "& .MuiInputBase-input": { fontSize: 18, py: 1.2 } }}
                />

                <Button type="submit" variant="contained" fullWidth size="large" sx={{ mt: 3, py: 1.5, fontSize: 18 }}>
                  Update Password
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

export default Login;

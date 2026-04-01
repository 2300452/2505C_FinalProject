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
import { Link, useSearchParams } from "react-router-dom";
import { requestPasswordReset } from "../../services/demoStore";

function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const portal = searchParams.get("portal") === "patient" ? "patient" : "staff";
  const [form, setForm] = useState({
    email: "",
    portal,
  });
  const [message, setMessage] = useState("");
  const [tempPassword, setTempPassword] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setTempPassword("");

    try {
      const result = await requestPasswordReset(form.email, form.portal);
      setMessage(
        `Temporary password generated for ${result.user.name}. In this frontend simulation, the password is shown below instead of being emailed.`
      );
      setTempPassword(result.tempPassword);
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Card>
          <CardContent>
            <Typography variant="h4" gutterBottom>
              Forgot Password
            </Typography>

            <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
              For now, email sending is simulated. The temporary password will be shown on screen.
            </Typography>

            {message && (
              <Alert severity={tempPassword ? "success" : "error"} sx={{ mb: 2 }}>
                {message}
              </Alert>
            )}

            {tempPassword && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Temporary Password: <strong>{tempPassword}</strong>
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                label="Email"
                name="email"
                fullWidth
                margin="normal"
                value={form.email}
                onChange={handleChange}
              />

              <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
                Generate Temporary Password
              </Button>

              <Button component={Link} to={portal === "patient" ? "/patient/login" : "/staff/login"} variant="text" fullWidth sx={{ mt: 1 }}>
                Back to Login
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}

export default ForgotPassword;

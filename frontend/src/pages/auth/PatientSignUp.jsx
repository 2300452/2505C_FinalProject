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
import { createPatient } from "../../services/demoStore";

function PatientSignUp() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    dob: "",
    phone: "",
  });
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setSuccess("");

    try {
      const patient = await createPatient(form);
      setSuccess(`Account created successfully. Your patient ID is ${patient.generatedId}`);
      setTimeout(() => navigate("/"), 1200);
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
              Patient Sign Up
            </Typography>

            {message && <Alert severity="error" sx={{ mb: 2 }}>{message}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField label="Full Name" name="name" fullWidth margin="normal" value={form.name} onChange={handleChange} />
              <TextField label="Email" name="email" fullWidth margin="normal" value={form.email} onChange={handleChange} />
              <TextField label="Password" name="password" type="password" fullWidth margin="normal" value={form.password} onChange={handleChange} />
              <TextField label="Date of Birth" name="dob" type="date" fullWidth margin="normal" InputLabelProps={{ shrink: true }} value={form.dob} onChange={handleChange} />
              <TextField label="Phone" name="phone" fullWidth margin="normal" value={form.phone} onChange={handleChange} />

              <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
                Create Patient Account
              </Button>

              <Button component={Link} to="/" variant="text" fullWidth sx={{ mt: 1 }}>
                Back to Login
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}

export default PatientSignUp;

import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { createStaffUser, getAdmins, getDoctors } from "../../services/demoStore";

function AdminCreateUser() {
  const doctorDesignations = [
    "Junior Doctor",
    "Medical Officer",
    "Resident",
    "Consultant",
    "Senior Consultant",
    "Medical Director",
    "Other",
  ];

  const adminDesignations = [
    "Admin Assistant",
    "Clinic Admin",
    "Clinic Manager",
    "Operations Manager",
    "Hospital Administrator",
    "Other",
  ];

  const defaultDesignation = (role) =>
    role === "Doctor" ? "Medical Officer" : "Clinic Admin";

  const designationOptions = (role) =>
    role === "Doctor" ? doctorDesignations : adminDesignations;

  const [form, setForm] = useState({
    role: "Doctor",
    name: "",
    email: "",
    password: "",
    phone: "",
    specialty: "",
    designation: "Medical Officer",
    designationOther: "",
    reportsToUserId: "",
  });
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");
  const [reportingOptions, setReportingOptions] = useState([]);

  useEffect(() => {
    Promise.all([getAdmins(), getDoctors()])
      .then(([admins, doctors]) => setReportingOptions([...admins, ...doctors]))
      .catch(() => setReportingOptions([]));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "role") {
      setForm({
        ...form,
        role: value,
        designation: defaultDesignation(value),
        designationOther: "",
        specialty: value === "Doctor" ? form.specialty : "",
      });
      return;
    }
    setForm({
      ...form,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setSuccess("");

    if (form.designation === "Other" && !form.designationOther.trim()) {
      setMessage("Please enter a custom designation.");
      return;
    }

    try {
      const user = await createStaffUser({
        ...form,
        designation:
          form.designation === "Other" ? form.designationOther.trim() : form.designation,
      });
      setSuccess(`${user.role} created successfully. Generated ID: ${user.generatedId}`);
      setForm({
        role: "Doctor",
        name: "",
        email: "",
        password: "",
        phone: "",
        specialty: "",
        designation: "Medical Officer",
        designationOther: "",
        reportsToUserId: "",
      });
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Create Staff Account
      </Typography>

      {message && <Alert severity="error" sx={{ mb: 2 }}>{message}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Card sx={{ maxWidth: 600 }}>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              select
              label="Account Type"
              name="role"
              fullWidth
              margin="normal"
              value={form.role}
              onChange={handleChange}
            >
              <MenuItem value="Doctor">Doctor</MenuItem>
              <MenuItem value="Admin">Admin</MenuItem>
            </TextField>
            <TextField
              label="Full Name"
              name="name"
              fullWidth
              margin="normal"
              value={form.name}
              onChange={handleChange}
            />
            <TextField
              label="Email"
              name="email"
              fullWidth
              margin="normal"
              value={form.email}
              onChange={handleChange}
            />
            <TextField
              label="Temporary Password"
              name="password"
              type="password"
              fullWidth
              margin="normal"
              value={form.password}
              onChange={handleChange}
            />
            <TextField
              label="Phone"
              name="phone"
              fullWidth
              margin="normal"
              value={form.phone}
              onChange={handleChange}
            />
            <TextField
              select
              label="Designation"
              name="designation"
              fullWidth
              margin="normal"
              value={form.designation}
              onChange={handleChange}
            >
              {designationOptions(form.role).map((designation) => (
                <MenuItem key={designation} value={designation}>
                  {designation}
                </MenuItem>
              ))}
            </TextField>
            {form.designation === "Other" && (
              <TextField
                label="Custom Designation"
                name="designationOther"
                fullWidth
                margin="normal"
                value={form.designationOther}
                onChange={handleChange}
                placeholder="Enter designation"
              />
            )}
            {form.role === "Doctor" && (
              <TextField
                label="Specialty"
                name="specialty"
                fullWidth
                margin="normal"
                value={form.specialty}
                onChange={handleChange}
              />
            )}
            <TextField
              select
              label="Reports To"
              name="reportsToUserId"
              fullWidth
              margin="normal"
              value={form.reportsToUserId}
              onChange={handleChange}
            >
              <MenuItem value="">None</MenuItem>
              {reportingOptions.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  {option.name} ({option.generatedId}) - {option.designation || option.role}
                </MenuItem>
              ))}
            </TextField>

            <Button type="submit" variant="contained" sx={{ mt: 2 }}>
              Create Account
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default AdminCreateUser;

import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";
import { updateCurrentUserProfile } from "../../services/demoStore";

const GENDER_OPTIONS = ["Male", "Female", "Prefer not to say"];

function calculateAgeFromDob(dob) {
  if (!dob) return "";
  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return "";
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : "";
}

function UserProfilePage() {
  const { user, refreshUser, changeOwnPassword } = useAuth();
  const theme = useTheme();
  const shell = theme.palette.custom;

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    allergies: "",
    existingConditions: "",
    specialty: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");
  const derivedAge = calculateAgeFromDob(profileForm.dob);

  useEffect(() => {
    if (!user) return;

    setProfileForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      dob: user.dob || "",
      gender: user.gender || "",
      allergies: user.allergies || "",
      existingConditions: user.existingConditions || "",
      specialty: user.specialty || "",
    });
  }, [user]);

  const handleSaveProfile = async () => {
    try {
      await updateCurrentUserProfile(user.id, {
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone,
        dob: user.role === "Patient" ? profileForm.dob : "",
        gender: profileForm.gender,
        allergies: user.role === "Patient" ? profileForm.allergies : "",
        existingConditions: user.role === "Patient" ? profileForm.existingConditions : "",
        specialty: user.role === "Doctor" ? profileForm.specialty : "",
      });
      await refreshUser();
      setMessage("Profile updated successfully.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      setMessage("New password must be at least 6 characters.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    await changeOwnPassword(passwordForm.newPassword);
    setPasswordForm({
      newPassword: "",
      confirmPassword: "",
    });
    setMessage("Password changed successfully.");
  };

  if (!user) {
    return null;
  }

  return (
    <Box>
      <Box
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 4,
          color: shell.heading,
          background: `linear-gradient(90deg, ${shell.primarySoft} 0%, ${theme.palette.background.paper} 100%)`,
          border: `1px solid ${shell.border}`,
        }}
      >
        <Typography variant="h4" gutterBottom sx={{ mb: 0.5 }}>
          My Profile
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Keep your account details and password up to date.
        </Typography>
      </Box>

      {message && <Alert severity="info" sx={{ mb: 2 }}>{message}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card sx={{ mb: { xs: 0, md: 0 } }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Profile Information
              </Typography>

              <Typography sx={{ mb: 2 }}>
                <strong>{user.role} ID:</strong> {user.generatedId}
              </Typography>
              <Typography sx={{ mb: 2 }}>
                <strong>Age:</strong> {derivedAge !== "" ? derivedAge : user.age ?? "-"}
              </Typography>

              <Stack spacing={2}>
                <TextField
                  label="Full Name"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                />

                <TextField
                  label="Email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                />

                <TextField
                  label="Phone"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                />

                <TextField
                  select
                  label="Gender"
                  value={profileForm.gender}
                  onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                >
                  {GENDER_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>

                {user.role === "Patient" && (
                  <TextField
                    type="date"
                    label="Date of Birth"
                    InputLabelProps={{ shrink: true }}
                    value={profileForm.dob}
                    onChange={(e) => setProfileForm({ ...profileForm, dob: e.target.value })}
                  />
                )}

                {user.role === "Patient" && (
                  <TextField
                    label="Allergies"
                    value={profileForm.allergies}
                    onChange={(e) => setProfileForm({ ...profileForm, allergies: e.target.value })}
                  />
                )}

                {user.role === "Patient" && (
                  <TextField
                    label="Existing Conditions"
                    value={profileForm.existingConditions}
                    onChange={(e) => setProfileForm({ ...profileForm, existingConditions: e.target.value })}
                  />
                )}

                {user.role === "Doctor" && (
                  <TextField
                    label="Specialty"
                    value={profileForm.specialty}
                    onChange={(e) => setProfileForm({ ...profileForm, specialty: e.target.value })}
                  />
                )}

                <Button variant="contained" onClick={handleSaveProfile}>
                  Save Profile
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Change Password
              </Typography>

              <Stack spacing={2}>
                <TextField
                  label="New Password"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                />

                <TextField
                  label="Confirm New Password"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                />

                <Button variant="contained" onClick={handleChangePassword}>
                  Change Password
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default UserProfilePage;

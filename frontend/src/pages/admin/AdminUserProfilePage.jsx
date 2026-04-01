import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import {
  getAdminUserProfile,
  getAdmins,
  getDoctors,
  updateManagedUserProfile,
} from "../../services/demoStore";
import AssessmentRecordCard from "../../components/common/AssessmentRecordCard";

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

function designationOptions(role) {
  return role === "Doctor" ? doctorDesignations : adminDesignations;
}

function resolveDesignationState(role, designation) {
  if (!designation) {
    return { designation: "", designationOther: "" };
  }

  const options = designationOptions(role);
  if (options.includes(designation)) {
    return { designation, designationOther: "" };
  }

  return { designation: "Other", designationOther: designation };
}

function AdminUserProfilePage() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [reportingOptions, setReportingOptions] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    dob: "",
    specialty: "",
    designation: "",
    designationOther: "",
    reportsToUserId: "",
  });
  const [message, setMessage] = useState("");

  const user = profile?.user ?? null;
  const appointments = profile?.appointments ?? [];
  const records = profile?.records ?? [];

  const showDob = user?.role === "Patient";
  const showSpecialty = user?.role === "Doctor";
  const showAdminFields = user?.role === "Doctor" || user?.role === "Admin";

  const loadData = async () => {
    const [profileData, admins, doctors] = await Promise.all([
      getAdminUserProfile(userId),
      getAdmins(),
      getDoctors(),
    ]);
    const managedUser = profileData.user;
    setProfile(profileData);
    const designationState = resolveDesignationState(
      managedUser.role,
      managedUser.designation || "",
    );

    setForm({
      name: managedUser.name || "",
      email: managedUser.email || "",
      phone: managedUser.phone || "",
      dob: managedUser.dob || "",
      specialty: managedUser.specialty || "",
      designation: designationState.designation,
      designationOther: designationState.designationOther,
      reportsToUserId: managedUser.reportsToUserId || "",
    });
    setReportingOptions(
      [...admins, ...doctors].filter((option) => option.id !== managedUser.id)
    );
  };

  useEffect(() => {
    loadData().catch((error) => setMessage(error.message));
  }, [userId]);

  const handleSave = async () => {
    try {
      const designationValue =
        showAdminFields && form.designation === "Other"
          ? form.designationOther.trim()
          : form.designation;

      if (showAdminFields && form.designation === "Other" && !designationValue) {
        setMessage("Please enter a custom designation.");
        return;
      }

      const updatedUser = await updateManagedUserProfile(user.id, {
        ...form,
        designation: designationValue,
      });
      setProfile((current) => ({ ...current, user: updatedUser }));
      setMessage("User profile updated successfully.");
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  if (!user) {
    return <Typography>User not found.</Typography>;
  }

  return (
    <Box>
      <Button sx={{ mb: 2 }} onClick={() => navigate("/admin/users")}>
        Back to users
      </Button>

      <Typography variant="h4" gutterBottom>
        User Profile
      </Typography>

      {message && <Alert severity="info" sx={{ mb: 2 }}>{message}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                User Details
              </Typography>

              <Stack spacing={2}>
                <TextField
                  label="Role"
                  value={user.role}
                  disabled
                />
                <TextField
                  label={`${user.role} ID`}
                  value={user.generatedId}
                  disabled
                />
                <TextField
                  label="Full Name"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
                <TextField
                  label="Email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                />
                <TextField
                  label="Phone"
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                />
                {showDob && (
                  <TextField
                    type="date"
                    label="Date of Birth"
                    InputLabelProps={{ shrink: true }}
                    value={form.dob}
                    onChange={(event) => setForm({ ...form, dob: event.target.value })}
                  />
                )}
                {showSpecialty && (
                  <TextField
                    label="Specialty"
                    value={form.specialty}
                    onChange={(event) => setForm({ ...form, specialty: event.target.value })}
                  />
                )}
                {showAdminFields && (
                  <TextField
                    select
                    label="Designation"
                    value={form.designation}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        designation: event.target.value,
                        designationOther:
                          event.target.value === "Other" ? form.designationOther : "",
                      })
                    }
                  >
                    {designationOptions(user.role).map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
                {showAdminFields && form.designation === "Other" && (
                  <TextField
                    label="Custom Designation"
                    value={form.designationOther}
                    onChange={(event) =>
                      setForm({ ...form, designationOther: event.target.value })
                    }
                  />
                )}
                {showAdminFields && (
                  <TextField
                    select
                    label="Reports To"
                    value={form.reportsToUserId}
                    onChange={(event) => setForm({ ...form, reportsToUserId: event.target.value })}
                  >
                    <MenuItem value="">None</MenuItem>
                    {reportingOptions.map((option) => (
                      <MenuItem key={option.id} value={option.id}>
                        {option.name} ({option.generatedId}) - {option.designation || option.role}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
                <Button variant="contained" onClick={handleSave}>
                  Save Changes
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Appointments
              </Typography>

              {appointments.length === 0 ? (
                <Typography>No appointments found.</Typography>
              ) : (
                <Stack spacing={2}>
                  {appointments.map((appointment) => (
                    <Box key={appointment.id} sx={{ border: "1px solid #ddd", borderRadius: 2, p: 2 }}>
                      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                        <Typography sx={{ fontWeight: 700 }}>
                          {appointment.date} at {appointment.time}
                        </Typography>
                        <Chip label={appointment.status} size="small" />
                      </Stack>
                      <Typography variant="body2">
                        Patient: {appointment.patientName} ({appointment.patientGeneratedId})
                      </Typography>
                      <Typography variant="body2">
                        Doctor: {appointment.doctorName} {appointment.doctorGeneratedId ? `(${appointment.doctorGeneratedId})` : ""}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Medical Records
              </Typography>

              {records.length === 0 ? (
                <Typography>No medical records found.</Typography>
              ) : (
                <Stack spacing={2}>
                  {records.map((record, index) => (
                    <AssessmentRecordCard key={record.id} record={record} index={index + 1} />
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default AdminUserProfilePage;

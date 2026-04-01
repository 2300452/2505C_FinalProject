import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import PersonAddAlt1OutlinedIcon from "@mui/icons-material/PersonAddAlt1Outlined";
import RecyclingOutlinedIcon from "@mui/icons-material/RecyclingOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import VaccinesOutlinedIcon from "@mui/icons-material/VaccinesOutlined";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  getAppointments,
  getDoctors,
  getPatients,
  getUsers,
  rescheduleAppointment,
} from "../../services/demoStore";

function AdminDashboard() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [rescheduleForm, setRescheduleForm] = useState({});

  const loadData = async () => {
    const [doctorData, patientData, appointmentData, userData] = await Promise.all([
      getDoctors(),
      getPatients(),
      getAppointments(),
      getUsers(true),
    ]);
    setDoctors(doctorData);
    setPatients(patientData);
    setAppointments(appointmentData);
    setUsers(userData);
  };

  useEffect(() => {
    loadData().catch((error) => setMessage(error.message));
  }, []);

  const handleReschedule = async (appointmentId) => {
    try {
      const current = rescheduleForm[appointmentId];
      if (!current?.date || !current?.time) {
        setMessage("Please enter both date and time for rescheduling.");
        return;
      }

      await rescheduleAppointment(appointmentId, current.date, current.time);
      setMessage("Appointment rescheduled successfully.");
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const recycledCount = useMemo(
    () => users.filter((item) => item.isDeleted).length,
    [users]
  );
  const adminCount = useMemo(
    () => users.filter((item) => item.role === "Admin" && !item.isDeleted).length,
    [users]
  );

  const statCards = [
    {
      title: "Active Doctors",
      value: doctors.length,
      icon: <VaccinesOutlinedIcon sx={{ fontSize: 32 }} />,
      onClick: () => navigate("/admin/users"),
    },
    {
      title: "Active Patients",
      value: patients.length,
      icon: <GroupOutlinedIcon sx={{ fontSize: 32 }} />,
      onClick: () => navigate("/admin/users"),
    },
    {
      title: "Administrators",
      value: adminCount,
      icon: <ShieldOutlinedIcon sx={{ fontSize: 32 }} />,
      onClick: () => navigate("/admin/users"),
    },
    {
      title: "Appointments",
      value: appointments.length,
      icon: <CalendarMonthOutlinedIcon sx={{ fontSize: 32 }} />,
      onClick: () => document.getElementById("admin-appointments")?.scrollIntoView({ behavior: "smooth" }),
    },
  ];

  const featureCards = [
    {
      title: "Create Staff Account",
      caption: "Add admins and doctors",
      icon: <PersonAddAlt1OutlinedIcon sx={{ fontSize: 28 }} />,
      onClick: () => navigate("/admin/create-user"),
    },
    {
      title: "Manage Users",
      caption: "Search, reset, recycle",
      icon: <GroupOutlinedIcon sx={{ fontSize: 28 }} />,
      onClick: () => navigate("/admin/users"),
    },
    {
      title: "Recycle Bin",
      caption: `${recycledCount} accounts awaiting review`,
      icon: <RecyclingOutlinedIcon sx={{ fontSize: 28 }} />,
      onClick: () => navigate("/admin/users"),
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ color: "#138f87", fontWeight: 700 }}>
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Dashboard features
        </Typography>
      </Box>

      {message && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statCards.map((card) => (
          <Grid item xs={12} sm={6} lg={3} key={card.title}>
            <Card
              onClick={card.onClick}
              sx={{
                bgcolor: "#11a39a",
                color: "white",
                cursor: "pointer",
                minHeight: 140,
                boxShadow: "none",
                "&:hover": { transform: "translateY(-2px)" },
                transition: "transform 0.18s ease",
              }}
            >
              <CardContent sx={{ height: "100%" }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 700, mb: 1 }}>
                      {card.title}
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 800 }}>
                      {card.value}
                    </Typography>
                  </Box>
                  <Box sx={{ opacity: 0.95 }}>{card.icon}</Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {featureCards.map((card) => (
          <Grid item xs={12} md={4} key={card.title}>
            <Paper
              onClick={card.onClick}
              sx={{
                p: 3,
                cursor: "pointer",
                border: "1px solid #dbe4e8",
                boxShadow: "none",
                "&:hover": { borderColor: "#11a39a", boxShadow: "0 8px 24px rgba(17,163,154,0.12)" },
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ color: "#11a39a" }}>{card.icon}</Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {card.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {card.caption}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Card id="admin-appointments" sx={{ boxShadow: "none", border: "1px solid #dde5ea" }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Reschedule / Change Patient Appointment
          </Typography>

          {appointments.length === 0 ? (
            <Typography>No appointments found.</Typography>
          ) : (
            <Stack spacing={2}>
              {appointments.map((appt) => (
                <Box
                  key={appt.id}
                  sx={{ border: "1px solid #ddd", borderRadius: 2, p: 2 }}
                >
                  <Typography><strong>Patient ID:</strong> {appt.patientGeneratedId}</Typography>
                  <Typography><strong>Doctor:</strong> {appt.doctorName} ({appt.doctorGeneratedId || "Unassigned"})</Typography>
                  <Typography><strong>Current Slot:</strong> {appt.date} {appt.time}</Typography>
                  <Typography><strong>Status:</strong> {appt.status}</Typography>

                  <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mt: 2 }}>
                    <TextField
                      type="date"
                      label="New Date"
                      InputLabelProps={{ shrink: true }}
                      value={rescheduleForm[appt.id]?.date || ""}
                      onChange={(e) =>
                        setRescheduleForm({
                          ...rescheduleForm,
                          [appt.id]: {
                            ...rescheduleForm[appt.id],
                            date: e.target.value,
                          },
                        })
                      }
                    />
                    <TextField
                      type="time"
                      label="New Time"
                      InputLabelProps={{ shrink: true }}
                      value={rescheduleForm[appt.id]?.time || ""}
                      onChange={(e) =>
                        setRescheduleForm({
                          ...rescheduleForm,
                          [appt.id]: {
                            ...rescheduleForm[appt.id],
                            time: e.target.value,
                          },
                        })
                      }
                    />
                    <Button variant="contained" onClick={() => handleReschedule(appt.id)}>
                      Reschedule
                    </Button>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default AdminDashboard;

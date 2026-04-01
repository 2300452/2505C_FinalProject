import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import FolderSharedOutlinedIcon from "@mui/icons-material/FolderSharedOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import TodayOutlinedIcon from "@mui/icons-material/TodayOutlined";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  getAppointments,
  getFailedAlerts,
  getPatients,
  getRecords,
} from "../../services/demoStore";

function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [patients, setPatients] = useState([]);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getAppointments(),
      getFailedAlerts(),
      getPatients(),
      getRecords(),
    ])
      .then(([appointmentData, alertData, patientData, recordData]) => {
        setAppointments(appointmentData);
        setAlerts(alertData);
        setPatients(patientData);
        setRecords(recordData);
      })
      .catch(() => {
        setAppointments([]);
        setAlerts([]);
        setPatients([]);
        setRecords([]);
      });
  }, [user]);

  const upcomingThisWeek = useMemo(
    () => appointments.filter((item) => item.status === "Booked" || item.status === "Rescheduled").length,
    [appointments]
  );

  const statCards = [
    {
      title: "Doctor Schedule",
      value: appointments.length,
      icon: <CalendarMonthOutlinedIcon sx={{ fontSize: 30 }} />,
      onClick: () => navigate("/doctor/appointments"),
    },
    {
      title: "Active Patients",
      value: patients.length,
      icon: <FolderSharedOutlinedIcon sx={{ fontSize: 30 }} />,
      onClick: () => navigate("/doctor/patients"),
    },
    {
      title: "Flagged Alerts",
      value: alerts.length,
      icon: <ReportProblemOutlinedIcon sx={{ fontSize: 30 }} />,
      onClick: () => navigate("/doctor/alerts"),
    },
    {
      title: "This Week",
      value: upcomingThisWeek,
      icon: <TodayOutlinedIcon sx={{ fontSize: 30 }} />,
      onClick: () => navigate("/doctor/appointments"),
    },
  ];

  return (
    <Box>
      <Paper
        sx={{
          p: 3,
          mb: 3,
          color: "white",
          borderRadius: 0,
          background: "linear-gradient(90deg, #29c2c5 0%, #60d3c4 100%)",
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Doctor Schedule
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          Welcome back, {user?.name}. Review appointments, alerts, and patient records from one place.
        </Typography>
      </Paper>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statCards.map((card) => (
          <Grid item xs={12} sm={6} lg={3} key={card.title}>
            <Card
              onClick={card.onClick}
              sx={{
                bgcolor: "#16b3ae",
                color: "white",
                cursor: "pointer",
                boxShadow: "none",
                minHeight: 130,
              }}
            >
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      {card.title}
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 800, mt: 1 }}>
                      {card.value}
                    </Typography>
                  </Box>
                  {card.icon}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: "100%", boxShadow: "none", border: "1px solid #dbe4e8" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Appointment Notifications
              </Typography>

              {appointments.length === 0 ? (
                <Alert severity="info">No patient appointments booked yet.</Alert>
              ) : (
                <Stack spacing={2}>
                  {appointments.slice(0, 8).map((appt, index) => (
                    <Box
                      key={appt.id}
                      sx={{
                        pl: 2,
                        borderLeft: `3px solid ${index % 2 === 0 ? "#16b3ae" : "#7b61ff"}`,
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        Patient ID: {appt.patientGeneratedId}
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        {appt.patientGeneratedId}
                      </Typography>
                      <Typography variant="caption" display="block">
                        {appt.date} at {appt.time}
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        Status: {appt.status}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Card sx={{ height: "100%", boxShadow: "none", border: "1px solid #dbe4e8" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Shared Clinic Appointments
              </Typography>

              {appointments.length === 0 ? (
                <Alert severity="info">No scheduled appointments.</Alert>
              ) : (
                <Stack spacing={2}>
                  {appointments.slice(0, 6).map((item) => (
                    <Box
                      key={item.id}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: "1px solid #edf2f4",
                        bgcolor: "#fbfcfd",
                      }}
                    >
                      <Typography sx={{ fontWeight: 700 }}>
                        Patient ID: {item.patientGeneratedId}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.date} at {item.time}
                      </Typography>
                      <Typography variant="body2">
                        Status: <strong>{item.status}</strong>
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={3}>
          <Card sx={{ height: "100%", boxShadow: "none", border: "1px solid #dbe4e8" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Snapshot
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Records
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {records.length}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Alert Cases
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: alerts.length ? "#d96459" : "#16b3ae" }}>
                    {alerts.length}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Patients Tracked
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {patients.length}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default DoctorDashboard;

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { getAppointments, rescheduleAppointment } from "../../services/demoStore";

function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [rescheduleForm, setRescheduleForm] = useState({});
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState("outstanding");

  const loadAppointments = async () => {
    const appointmentData = await getAppointments();
    setAppointments(appointmentData);
  };

  useEffect(() => {
    loadAppointments().catch((error) => setMessage(error.message));
  }, []);

  const outstandingAppointments = useMemo(
    () => appointments.filter((item) => item.status !== "Completed"),
    [appointments]
  );

  const completedAppointments = useMemo(
    () => appointments.filter((item) => item.status === "Completed"),
    [appointments]
  );

  const handleReschedule = async (appointmentId) => {
    const current = rescheduleForm[appointmentId];
    if (!current?.date || !current?.time) {
      setMessage("Please enter both date and time for rescheduling.");
      return;
    }

    try {
      await rescheduleAppointment(appointmentId, current.date, current.time);
      setMessage("Appointment rescheduled successfully.");
      setRescheduleForm((existing) => ({ ...existing, [appointmentId]: { date: "", time: "" } }));
      await loadAppointments();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const renderRescheduleItem = (appointment) => (
    <Card key={appointment.id} sx={{ boxShadow: "none", border: "1px solid #dde5ea" }}>
      <CardContent>
        <Typography variant="h6">Patient ID: {appointment.patientGeneratedId}</Typography>
        <Typography variant="body2">
          Doctor: {appointment.doctorName} {appointment.doctorGeneratedId ? `(${appointment.doctorGeneratedId})` : "(Unassigned)"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Current slot: {appointment.date} at {appointment.time}
        </Typography>
        <Typography variant="body2">Status: {appointment.status}</Typography>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mt: 2 }}>
          <TextField
            type="date"
            label="New Date"
            InputLabelProps={{ shrink: true }}
            value={rescheduleForm[appointment.id]?.date || ""}
            onChange={(event) =>
              setRescheduleForm((current) => ({
                ...current,
                [appointment.id]: {
                  ...current[appointment.id],
                  date: event.target.value,
                },
              }))
            }
          />
          <TextField
            type="time"
            label="New Time"
            InputLabelProps={{ shrink: true }}
            value={rescheduleForm[appointment.id]?.time || ""}
            onChange={(event) =>
              setRescheduleForm((current) => ({
                ...current,
                [appointment.id]: {
                  ...current[appointment.id],
                  time: event.target.value,
                },
              }))
            }
          />
          <Button variant="contained" onClick={() => handleReschedule(appointment.id)}>
            Reschedule
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Appointments
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage outstanding patient appointments, reschedule active appointments, and review completed locked consultations.
      </Typography>

      {message && <Alert severity="info" sx={{ mb: 2 }}>{message}</Alert>}

      <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }}>
        <Tab value="outstanding" label={`Outstanding (${outstandingAppointments.length})`} />
        <Tab value="completed" label={`Completed (${completedAppointments.length})`} />
      </Tabs>

      {tab === "outstanding" && (
        <Stack spacing={2}>
          {outstandingAppointments.length === 0 ? (
            <Alert severity="info">No outstanding patient appointments.</Alert>
          ) : (
            outstandingAppointments.map(renderRescheduleItem)
          )}
        </Stack>
      )}

      {tab === "completed" && (
        <Stack spacing={2}>
          {completedAppointments.length === 0 ? (
            <Alert severity="info">No completed appointments found.</Alert>
          ) : (
            completedAppointments.map((appointment) => (
              <Card key={appointment.id} sx={{ boxShadow: "none", border: "1px solid #dde5ea", bgcolor: "#f8fbfc" }}>
                <CardContent>
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                    <Box>
                      <Typography variant="h6">Patient ID: {appointment.patientGeneratedId}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {appointment.date} at {appointment.time}
                      </Typography>
                      <Typography variant="body2">
                        Doctor: {appointment.doctorName} {appointment.doctorGeneratedId ? `(${appointment.doctorGeneratedId})` : "(Unassigned)"}
                      </Typography>
                    </Box>
                    <Chip label={appointment.status} color="success" />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Completed consultations are locked and cannot be edited or rescheduled.
                  </Typography>
                </CardContent>
              </Card>
            ))
          )}
        </Stack>
      )}
    </Box>
  );
}

export default AdminAppointmentsPage;

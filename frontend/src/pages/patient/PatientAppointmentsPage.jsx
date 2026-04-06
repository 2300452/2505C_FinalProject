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
import { useAuth } from "../../contexts/AuthContext";
import { getAppointmentsForPatient, rescheduleAppointment } from "../../services/demoStore";

function PatientAppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [tab, setTab] = useState("outstanding");
  const [message, setMessage] = useState("");
  const [rescheduleDraft, setRescheduleDraft] = useState({});

  const loadAppointments = async () => {
    if (!user) return;
    const appointmentData = await getAppointmentsForPatient(user.id);
    setAppointments(appointmentData);
  };

  useEffect(() => {
    loadAppointments().catch(() => setAppointments([]));
  }, [user]);

  const outstandingAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.status !== "Completed"),
    [appointments]
  );

  const completedAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.status === "Completed"),
    [appointments]
  );

  const handleReschedule = async (appointmentId) => {
    const draft = rescheduleDraft[appointmentId];
    if (!draft?.date || !draft?.time) {
      setMessage("Please choose a new date and time before rescheduling.");
      return;
    }

    try {
      await rescheduleAppointment(appointmentId, draft.date, draft.time);
      setMessage("Appointment rescheduled successfully.");
      setRescheduleDraft((current) => ({ ...current, [appointmentId]: { date: "", time: "" } }));
      await loadAppointments();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const renderAppointment = (appointment, allowReschedule = false) => (
    <Card key={appointment.id} sx={{ boxShadow: "none", border: "1px solid #dde5ea" }}>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
            <Box>
              <Typography variant="h6">{appointment.date}</Typography>
              <Typography>Time: {appointment.time}</Typography>
              <Typography>Status: {appointment.status}</Typography>
            </Box>
            <Chip
              label={appointment.status}
              color={appointment.status === "Completed" ? "success" : "default"}
              sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
            />
          </Stack>

          {allowReschedule && (
            <Box>
              <Button
                variant="outlined"
                onClick={() =>
                  setRescheduleDraft((current) => ({
                    ...current,
                    [appointment.id]: current[appointment.id] ?? {
                      date: appointment.date,
                      time: appointment.time,
                    },
                  }))
                }
              >
                Change / Reschedule Appointment
              </Button>

              {rescheduleDraft[appointment.id] && (
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 2 }}>
                  <TextField
                    type="date"
                    label="New Date"
                    InputLabelProps={{ shrink: true }}
                    value={rescheduleDraft[appointment.id]?.date || ""}
                    onChange={(event) =>
                      setRescheduleDraft((current) => ({
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
                    value={rescheduleDraft[appointment.id]?.time || ""}
                    onChange={(event) =>
                      setRescheduleDraft((current) => ({
                        ...current,
                        [appointment.id]: {
                          ...current[appointment.id],
                          time: event.target.value,
                        },
                      }))
                    }
                  />
                  <Button variant="contained" onClick={() => handleReschedule(appointment.id)}>
                    Save New Slot
                  </Button>
                </Stack>
              )}
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ maxWidth: 760 }}>
      <Typography variant="h4" gutterBottom>
        My Appointments
      </Typography>

      {message && <Alert severity="info" sx={{ mb: 2 }}>{message}</Alert>}

      <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }}>
        <Tab value="outstanding" label={`Outstanding (${outstandingAppointments.length})`} />
        <Tab value="completed" label={`Completed (${completedAppointments.length})`} />
      </Tabs>

      {tab === "outstanding" && (
        <Stack spacing={2}>
          {outstandingAppointments.length === 0 ? (
            <Alert severity="info">No outstanding appointments.</Alert>
          ) : (
            outstandingAppointments.map((appointment) => renderAppointment(appointment, true))
          )}
        </Stack>
      )}

      {tab === "completed" && (
        <Stack spacing={2}>
          {completedAppointments.length === 0 ? (
            <Alert severity="info">No completed appointments yet.</Alert>
          ) : (
            completedAppointments.map(renderAppointment)
          )}
        </Stack>
      )}
    </Box>
  );
}

export default PatientAppointmentsPage;

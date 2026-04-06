import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import AppointmentCalendar from "../../components/schedule/AppointmentCalendar";
import {
  doctorRescheduleAppointment,
  getAppointments,
} from "../../services/demoStore";
import { useAuth } from "../../contexts/AuthContext";

function DoctorAppointments() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [message, setMessage] = useState("");
  const [rescheduleDraft, setRescheduleDraft] = useState({});
  const [tab, setTab] = useState("outstanding");
  const activeAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.status !== "Completed"),
    [appointments]
  );
  const completedAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.status === "Completed"),
    [appointments]
  );

  const loadAppointments = async () => {
    if (!user) return;
    const appointmentData = await getAppointments();
    setAppointments(appointmentData);
  };

  useEffect(() => {
    loadAppointments().catch(() => setAppointments([]));
  }, [user]);

  const handleReschedule = async (appointmentId) => {
    const draft = rescheduleDraft[appointmentId];
    if (!draft?.date || !draft?.time) {
      setMessage("Please choose a new date and time before rescheduling.");
      return;
    }

    try {
      await doctorRescheduleAppointment(appointmentId, user.id, draft.date, draft.time);
      setMessage("Appointment rescheduled successfully.");
      setRescheduleDraft((current) => ({ ...current, [appointmentId]: { date: "", time: "" } }));
      await loadAppointments();
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Doctor Appointments
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        All doctors share the same clinic appointment pool, so booked patient times appear here for everyone.
      </Typography>
      {message && <Alert severity="info" sx={{ mb: 2 }}>{message}</Alert>}

      <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }}>
        <Tab value="outstanding" label={`Outstanding (${activeAppointments.length})`} />
        <Tab value="completed" label={`Completed (${completedAppointments.length})`} />
      </Tabs>

      {tab === "outstanding" && (
      <Grid container spacing={2}>
        <Grid item xs={12} lg={5}>
          <Stack spacing={2}>
            {activeAppointments.length === 0 ? (
              <Alert severity="info">No patient appointments booked yet.</Alert>
            ) : (
              activeAppointments.map((appt) => (
                <Card key={appt.id} sx={{ border: "1px solid #ddd", boxShadow: "none" }}>
                  <CardContent>
                    <Stack spacing={1.5}>
                      <Box>
                        <Typography variant="h6">Patient ID: {appt.patientGeneratedId}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Consultation-ready shared appointment
                        </Typography>
                      </Box>

                      <Typography variant="body2">
                        {appt.date} at {appt.time}
                      </Typography>
                      <Typography variant="body2">Status: {appt.status}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {appt.doctorGeneratedId
                          ? `Handled by Doctor ID: ${appt.doctorGeneratedId}`
                          : "Shared clinic appointment"}
                      </Typography>

                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <Button
                          variant="contained"
                          onClick={() => navigate(`/doctor/appointments/${appt.id}/consultation`)}
                        >
                          Appointment Completed
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() =>
                            setRescheduleDraft((current) => ({
                              ...current,
                              [appt.id]: current[appt.id] ?? { date: appt.date, time: appt.time },
                            }))
                          }
                        >
                          Appointment Reschedule
                        </Button>
                      </Stack>

                      {rescheduleDraft[appt.id] && (
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                          <TextField
                            type="date"
                            label="New Date"
                            InputLabelProps={{ shrink: true }}
                            value={rescheduleDraft[appt.id]?.date || ""}
                            onChange={(event) =>
                              setRescheduleDraft((current) => ({
                                ...current,
                                [appt.id]: {
                                  ...current[appt.id],
                                  date: event.target.value,
                                },
                              }))
                            }
                          />
                          <TextField
                            type="time"
                            label="New Time"
                            InputLabelProps={{ shrink: true }}
                            value={rescheduleDraft[appt.id]?.time || ""}
                            onChange={(event) =>
                              setRescheduleDraft((current) => ({
                                ...current,
                                [appt.id]: {
                                  ...current[appt.id],
                                  time: event.target.value,
                                },
                              }))
                            }
                          />
                          <Button variant="contained" onClick={() => handleReschedule(appt.id)}>
                            Save
                          </Button>
                        </Stack>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              ))
            )}

          </Stack>
        </Grid>

        <Grid item xs={12} lg={7}>
          <AppointmentCalendar
            appointments={activeAppointments}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            readOnly
            title="Shared Clinic Schedule"
          />
        </Grid>
      </Grid>
      )}

      {tab === "completed" && (
        <Stack spacing={2}>
          {completedAppointments.length === 0 ? (
            <Alert severity="info">No completed appointments yet.</Alert>
          ) : (
            completedAppointments.map((appt) => (
              <Card key={appt.id} sx={{ border: "1px solid #ddd", boxShadow: "none", bgcolor: "#f8fbfc" }}>
                <CardContent>
                  <Typography variant="h6">Patient ID: {appt.patientGeneratedId}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {appt.date} at {appt.time}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed by Doctor ID: {appt.doctorGeneratedId || "Not assigned"}
                  </Typography>
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

export default DoctorAppointments;

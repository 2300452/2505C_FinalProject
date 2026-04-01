import { useEffect, useState } from "react";
import { Alert, Box, Button, Grid, Typography } from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";
import AppointmentCalendar from "../../components/schedule/AppointmentCalendar";
import { createAppointment, getAppointments } from "../../services/demoStore";

function PatientBookAppointmentPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [form, setForm] = useState({
    date: "",
    time: "",
  });
  const [message, setMessage] = useState("");

  const loadAppointments = async () => {
    const appointmentData = await getAppointments();
    setAppointments(appointmentData);
  };

  useEffect(() => {
    loadAppointments().catch(() => setAppointments([]));
  }, []);

  const handleSubmit = async () => {
    try {
      await createAppointment({
        patientId: user.id,
        date: form.date,
        time: form.time,
      });
      setMessage("Appointment booked successfully.");
      setForm({ date: "", time: "" });
      await loadAppointments();
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Book Appointment
      </Typography>

      <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
        Choose a date first, then pick an available 30-minute slot.
      </Typography>

      {message && <Alert severity="info" sx={{ mb: 2 }}>{message}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <AppointmentCalendar
            appointments={appointments}
            selectedDate={form.date}
            onDateSelect={(date) => setForm({ date, time: "" })}
            selectedTime={form.time}
            onTimeSelect={(time) => setForm({ ...form, time })}
            patientFriendly
            title="Appointment Calendar"
          />
        </Grid>
        <Grid item xs={12} lg={4}>
          <Box
            sx={{
              p: 3,
              borderRadius: 4,
              border: (theme) => `1px solid ${theme.palette.custom.border}`,
              bgcolor: "background.paper",
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
              Booking Summary
            </Typography>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Date: {form.date || "Not selected"}
            </Typography>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Time: {form.time || "Not selected"}
            </Typography>
            <Button
              fullWidth
              size="large"
              variant="contained"
              disabled={!form.date || !form.time}
              onClick={handleSubmit}
            >
              Confirm Appointment
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

export default PatientBookAppointmentPage;

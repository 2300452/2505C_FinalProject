import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import AppointmentCalendar from "../../components/schedule/AppointmentCalendar";
import { getAppointments } from "../../services/demoStore";

function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    getAppointments().then(setAppointments).catch(() => setAppointments([]));
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Clinic Schedule
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Dark slots are already booked. Doctors and patients all see the same availability.
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={4}>
          <Box
            sx={{
              p: 3,
              borderRadius: 4,
              border: (theme) => `1px solid ${theme.palette.custom.border}`,
              bgcolor: "background.paper",
              height: "100%",
            }}
          >
            <Typography variant="h6" gutterBottom>
              Confirmed Appointments
            </Typography>

            {appointments.length === 0 ? (
              <Alert severity="info">No appointments found.</Alert>
            ) : (
              <Stack spacing={2}>
                {appointments.map((appt, index) => (
                  <Box
                    key={appt.id}
                    sx={{
                      pl: 2,
                      borderLeft: `4px solid ${index % 2 === 0 ? "#7eb8d9" : "#60d3c4"}`,
                    }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      {appt.patientName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {appt.patientGeneratedId}
                    </Typography>
                    <Typography variant="body2">
                      {appt.date} at {appt.time}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        </Grid>

        <Grid item xs={12} lg={8}>
          <AppointmentCalendar
            appointments={appointments}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            readOnly
            title="Shared Availability"
            highlightFullyBookedDates={false}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default DoctorAppointments;

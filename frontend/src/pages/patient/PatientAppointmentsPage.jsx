import { useEffect, useState } from "react";
import { Alert, Box, Card, CardContent, Stack, Typography } from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";
import { getAppointmentsForPatient } from "../../services/demoStore";

function PatientAppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    if (!user) return;
    getAppointmentsForPatient(user.id).then(setAppointments).catch(() => setAppointments([]));
  }, [user]);

  return (
    <Box sx={{ maxWidth: 760 }}>
      <Typography variant="h4" gutterBottom>
        My Appointments
      </Typography>

      {appointments.length === 0 ? (
        <Alert severity="info">No appointments booked yet.</Alert>
      ) : (
        <Stack spacing={2}>
          {appointments.map((appointment) => (
            <Card key={appointment.id} sx={{ boxShadow: "none", border: "1px solid #dde5ea" }}>
              <CardContent>
                <Typography variant="h6">{appointment.date}</Typography>
                <Typography>Time: {appointment.time}</Typography>
                <Typography>Status: {appointment.status}</Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
}

export default PatientAppointmentsPage;

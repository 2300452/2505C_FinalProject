import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Card, CardContent, Chip, Stack, Tab, Tabs, Typography } from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";
import { getAppointmentsForPatient } from "../../services/demoStore";

function PatientAppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [tab, setTab] = useState("outstanding");

  useEffect(() => {
    if (!user) return;
    getAppointmentsForPatient(user.id).then(setAppointments).catch(() => setAppointments([]));
  }, [user]);

  const outstandingAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.status !== "Completed"),
    [appointments]
  );

  const completedAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.status === "Completed"),
    [appointments]
  );

  const renderAppointment = (appointment) => (
    <Card key={appointment.id} sx={{ boxShadow: "none", border: "1px solid #dde5ea" }}>
      <CardContent>
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
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ maxWidth: 760 }}>
      <Typography variant="h4" gutterBottom>
        My Appointments
      </Typography>

      <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }}>
        <Tab value="outstanding" label={`Outstanding (${outstandingAppointments.length})`} />
        <Tab value="completed" label={`Completed (${completedAppointments.length})`} />
      </Tabs>

      {tab === "outstanding" && (
        <Stack spacing={2}>
          {outstandingAppointments.length === 0 ? (
            <Alert severity="info">No outstanding appointments.</Alert>
          ) : (
            outstandingAppointments.map(renderAppointment)
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

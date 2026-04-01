import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Stack,
  Typography,
} from "@mui/material";
import { getFailedAlerts } from "../../services/demoStore";
import AssessmentRecordListItem from "../../components/common/AssessmentRecordListItem";

function formatTimestamp(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function DoctorAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [message, setMessage] = useState("");

  const loadAlerts = () => {
    getFailedAlerts().then(setAlerts).catch(() => setAlerts([]));
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Failed Assessment Alerts
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        When an assessment falls into the red zone, review it here and decide the next follow-up.
      </Typography>
      {message && <Alert severity="info" sx={{ mb: 2 }}>{message}</Alert>}

      {alerts.length === 0 ? (
        <Alert severity="success">No failed cases at the moment.</Alert>
      ) : (
        <Stack spacing={2}>
          {alerts.map((alert, index) => (
            <AssessmentRecordListItem
              key={alert.id}
              title={`Patient ID: ${alert.patientGeneratedId}`}
              subtitle={`Assessment ${alert.assessmentNumber ?? index + 1}`}
              metadata={formatTimestamp(alert.createdAt)}
              result={alert.result}
              to={`/doctor/alerts/${alert.id}`}
              state={{ record: alert }}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}

export default DoctorAlerts;

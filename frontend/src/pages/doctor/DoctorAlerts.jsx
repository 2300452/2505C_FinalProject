import { useEffect, useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Stack,
  Chip,
  Typography,
} from "@mui/material";
import { getFailedAlerts, updateFailedAlertAction } from "../../services/demoStore";
import { useAuth } from "../../contexts/AuthContext";

function DoctorAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [message, setMessage] = useState("");

  const loadAlerts = () => {
    getFailedAlerts().then(setAlerts).catch(() => setAlerts([]));
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleAction = async (recordId, action) => {
    try {
      await updateFailedAlertAction(recordId, user.id, action);
      setMessage("Alert updated successfully.");
      loadAlerts();
    } catch (error) {
      setMessage(error.message);
    }
  };

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
          {alerts.map((alert) => (
            <Accordion key={alert.id} sx={{ border: "1px solid #ddd", boxShadow: "none", "&:before": { display: "none" } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: "100%", pr: 1 }}>
                  <Typography variant="h6">Patient ID: {alert.patientGeneratedId}</Typography>
                  <Chip label={alert.result || "Pending"} size="small" color={alert.result === "Fail" ? "error" : "default"} />
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>Test Type: {alert.testType}</Typography>
                <Typography>Video File: {alert.fileName}</Typography>
                <Typography>Recorded At: {new Date(alert.createdAt).toLocaleString()}</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1, mb: 1 }} flexWrap="wrap">
                  <Chip label={alert.alertStatus || "Pending Review"} size="small" />
                  {alert.followUpAction && <Chip label={alert.followUpAction} size="small" variant="outlined" />}
                  {alert.followUpDueDate && <Chip label={`Due ${alert.followUpDueDate}`} size="small" variant="outlined" />}
                </Stack>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => handleAction(alert.id, "request_retake")}
                  >
                    Ask For Another Video
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => handleAction(alert.id, "schedule_within_week")}
                  >
                    Schedule Within A Week
                  </Button>
                  <Button
                    variant="text"
                    onClick={() => handleAction(alert.id, "monitor")}
                  >
                    Monitor
                  </Button>
                </Stack>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      )}
    </Box>
  );
}

export default DoctorAlerts;

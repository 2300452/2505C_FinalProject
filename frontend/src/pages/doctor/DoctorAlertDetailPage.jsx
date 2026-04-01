import { useEffect, useState } from "react";
import { Alert, Box, Button, Chip, Stack, Typography } from "@mui/material";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { AssessmentRecordDetails } from "../../components/common/AssessmentRecordCard";
import { useAuth } from "../../contexts/AuthContext";
import { getFailedAlerts, getRecordById, updateFailedAlertAction } from "../../services/demoStore";

function DoctorAlertDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { recordId } = useParams();
  const [record, setRecord] = useState(location.state?.record || null);
  const [message, setMessage] = useState("");

  const loadRecord = async () => {
    if (location.state?.record && String(location.state.record.id) === String(recordId)) {
      setRecord(location.state.record);
      return;
    }

    const recordData = await getRecordById(recordId);
    if (recordData) {
      setRecord(recordData);
      return;
    }

    const alerts = await getFailedAlerts();
    const fallbackRecord = alerts.find((item) => String(item.id) === String(recordId)) || null;
    setRecord(fallbackRecord);
    if (!fallbackRecord) {
      setMessage("Medical record not found.");
    }
  };

  useEffect(() => {
    loadRecord().catch((error) => setMessage(error.message));
  }, [location.state, recordId]);

  const handleAction = async (action) => {
    try {
      await updateFailedAlertAction(recordId, user.id, action);
      setMessage("Alert updated successfully.");
      await loadRecord();
    } catch (error) {
      setMessage(error.message);
    }
  };

  if (!record && !message) {
    return <Typography>Loading alert...</Typography>;
  }

  if (!record) {
    return (
      <Box>
        <Button sx={{ mb: 2 }} onClick={() => navigate("/doctor/alerts")}>
          Back to alerts
        </Button>
        <Alert severity="info">{message || "Medical record not found."}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Button sx={{ mb: 2 }} onClick={() => navigate("/doctor/alerts")}>
        Back to alerts
      </Button>

      <Typography variant="h4" gutterBottom>
        Assessment Alert
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Patient ID: {record.patientGeneratedId} • Assessment {record.assessmentNumber ?? record.id}
      </Typography>
      {message && <Alert severity="info" sx={{ mb: 2 }}>{message}</Alert>}

      <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
        <Chip label={record.result || "Pending"} color={record.result === "Fail" ? "error" : record.result === "Pass" ? "success" : "default"} size="small" />
        <Chip label={record.alertStatus || "Pending Review"} size="small" />
        {record.followUpAction && <Chip label={record.followUpAction} size="small" variant="outlined" />}
        {record.followUpDueDate && <Chip label={`Due ${record.followUpDueDate}`} size="small" variant="outlined" />}
      </Stack>

      <AssessmentRecordDetails record={record} />

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 3 }}>
        <Button variant="outlined" onClick={() => handleAction("request_retake")}>
          Ask For Another Video
        </Button>
        <Button variant="contained" onClick={() => handleAction("schedule_within_week")}>
          Schedule Within A Week
        </Button>
        <Button variant="text" onClick={() => handleAction("monitor")}>
          Monitor
        </Button>
      </Stack>
    </Box>
  );
}

export default DoctorAlertDetailPage;

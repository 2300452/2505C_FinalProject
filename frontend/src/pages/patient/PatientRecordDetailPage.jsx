import { useEffect, useState } from "react";
import { Alert, Box, Button, Typography } from "@mui/material";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { AssessmentRecordDetails } from "../../components/common/AssessmentRecordCard";
import { useAuth } from "../../contexts/AuthContext";
import { getRecordById, getRecordsForPatient } from "../../services/demoStore";

function PatientRecordDetailPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { recordId } = useParams();
  const [record, setRecord] = useState(location.state?.record || null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (location.state?.record && String(location.state.record.id) === String(recordId)) {
      setRecord(location.state.record);
      return;
    }

    const loadRecord = async () => {
      const recordData = await getRecordById(recordId);
      if (recordData) {
        setRecord(recordData);
        return;
      }

      if (user) {
        const patientRecords = await getRecordsForPatient(user.id);
        const fallbackRecord =
          patientRecords.find((item) => String(item.id) === String(recordId)) || null;
        setRecord(fallbackRecord);
        if (!fallbackRecord) {
          setMessage("Medical record not found.");
        }
      }
    };

    loadRecord().catch((error) => setMessage(error.message));
  }, [location.state, recordId, user]);

  if (!record && !message) {
    return <Typography>Loading assessment...</Typography>;
  }

  if (!record) {
    return (
      <Box>
        <Button sx={{ mb: 2 }} onClick={() => navigate("/patient/records")}>
          Back to records
        </Button>
        <Alert severity="info">{message || "Medical record not found."}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Button sx={{ mb: 2 }} onClick={() => navigate("/patient/records")}>
        Back to records
      </Button>
      <Typography variant="h4" gutterBottom>
        {record.testType === "Consultation" ? "Consultation Details" : "Assessment Details"}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {record.testType === "Consultation" ? "Consultation" : "Assessment"} {record.assessmentNumber ?? record.id} • {record.result || "Pending"}
      </Typography>
      {message && <Alert severity="info" sx={{ mb: 2 }}>{message}</Alert>}
      <AssessmentRecordDetails record={record} />
    </Box>
  );
}

export default PatientRecordDetailPage;

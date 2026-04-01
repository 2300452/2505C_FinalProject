import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Stack,
  Typography,
} from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";
import { getRecordsForPatient } from "../../services/demoStore";
import AssessmentRecordListItem from "../../components/common/AssessmentRecordListItem";

function formatTimestamp(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function PatientRecordsPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [message, setMessage] = useState("");
  const orderedRecords = [...records].sort(
    (left, right) => new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime()
  );

  useEffect(() => {
    if (!user) return;
    getRecordsForPatient(user.id)
      .then(setRecords)
      .catch((error) => setMessage(error.message));
  }, [user]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Medical Records
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Review your uploaded assessments, measured timings, and doctor notes.
      </Typography>

      {message && <Alert severity="info" sx={{ mb: 2 }}>{message}</Alert>}

      {orderedRecords.length === 0 ? (
        <Typography>No medical records found yet.</Typography>
      ) : (
        <Stack spacing={2}>
          {orderedRecords.map((record, index) => (
            <AssessmentRecordListItem
              key={record.id}
              title={`${record.testType === "Consultation" ? "Consultation" : "Assessment"} ${record.assessmentNumber ?? index + 1}`}
              subtitle={record.testType}
              metadata={formatTimestamp(record.createdAt)}
              result={record.result}
              to={`/patient/records/${record.id}`}
              state={{ record }}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}

export default PatientRecordsPage;

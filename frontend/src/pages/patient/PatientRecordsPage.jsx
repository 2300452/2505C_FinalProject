import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Stack,
  Typography,
} from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";
import { getRecordsForPatient } from "../../services/demoStore";
import AssessmentRecordCard from "../../components/common/AssessmentRecordCard";

function PatientRecordsPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [message, setMessage] = useState("");

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

      {records.length === 0 ? (
        <Typography>No medical records found yet.</Typography>
      ) : (
        <Stack spacing={2}>
          {records.map((record, index) => (
            <AssessmentRecordCard key={record.id} record={record} index={index + 1} />
          ))}
        </Stack>
      )}
    </Box>
  );
}

export default PatientRecordsPage;

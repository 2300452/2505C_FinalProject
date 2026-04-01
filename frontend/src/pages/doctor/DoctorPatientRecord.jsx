import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  appendDoctorNote,
  getRecordsForPatient,
  getUserById,
} from "../../services/demoStore";
import AssessmentRecordCard from "../../components/common/AssessmentRecordCard";

function DoctorPatientRecord() {
  const { patientId } = useParams();
  const { user } = useAuth();

  const [patient, setPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [noteInput, setNoteInput] = useState({});
  const [message, setMessage] = useState("");

  const loadData = async () => {
    const [currentPatient, recordData] = await Promise.all([
      getUserById(patientId),
      getRecordsForPatient(patientId),
    ]);
    setPatient(currentPatient);
    setRecords(recordData);
  };

  useEffect(() => {
    loadData().catch(() => {
      setPatient(null);
      setRecords([]);
    });
  }, [patientId]);

  const handleAddNote = async (recordId) => {
    try {
      await appendDoctorNote(recordId, user.id, noteInput[recordId] || "");
      setNoteInput({
        ...noteInput,
        [recordId]: "",
      });
      setMessage("Doctor note added.");
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  if (!patient) {
    return <Typography>Patient not found.</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Patient Medical Record
      </Typography>

      {message && <Alert severity="info" sx={{ mb: 2 }}>{message}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6">Patient ID: {patient.generatedId}</Typography>
          <Typography color="text.secondary">
            Assessments are listed together with medical record notes from newest to oldest.
          </Typography>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Patient Activity
          </Typography>

          {records.length === 0 ? (
            <Typography>No assessments or medical records found.</Typography>
          ) : (
            <Stack spacing={3}>
              {records.map((record, index) => (
                <Box key={record.id}>
                  <AssessmentRecordCard record={record} index={index + 1} />
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Add Medical Record Note
          </Typography>

          {records.length === 0 ? (
            <Typography>No assessment available to attach a note to.</Typography>
          ) : (
            <Stack spacing={2}>
              {records.map((record) => (
                <Box key={record.id} sx={{ border: "1px solid #ddd", borderRadius: 2, p: 2 }}>
                  <Typography sx={{ mb: 1, fontWeight: 700 }}>
                    Assessment: {record.testType} ({record.result || "Pending"})
                  </Typography>
                  <TextField
                    label="Add doctor note"
                    multiline
                    rows={3}
                    fullWidth
                    value={noteInput[record.id] || ""}
                    onChange={(e) =>
                      setNoteInput({
                        ...noteInput,
                        [record.id]: e.target.value,
                      })
                    }
                  />

                  <Button
                    variant="contained"
                    sx={{ mt: 2 }}
                    onClick={() => handleAddNote(record.id)}
                  >
                    Add Note
                  </Button>
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default DoctorPatientRecord;

import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Stack,
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
  const orderedRecords = [...records].sort(
    (left, right) => new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime()
  );

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

          {orderedRecords.length === 0 ? (
            <Typography>No assessments or medical records found.</Typography>
          ) : (
            <Stack spacing={3}>
              {orderedRecords.map((record, index) => (
                <Box key={record.id}>
                  <AssessmentRecordCard
                    record={record}
                    index={index + 1}
                    noteValue={noteInput[record.id] || ""}
                    onNoteChange={(value) =>
                      setNoteInput((current) => ({
                        ...current,
                        [record.id]: value,
                      }))
                    }
                    onAddNote={() => handleAddNote(record.id)}
                    showNoteComposer
                  />
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

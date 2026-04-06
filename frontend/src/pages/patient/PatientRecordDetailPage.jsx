import { useEffect, useState } from "react";
import { Alert, Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { AssessmentRecordDetails } from "../../components/common/AssessmentRecordCard";
import { useAuth } from "../../contexts/AuthContext";
import { getAppointmentsForPatient, getRecordById, getRecordsForPatient } from "../../services/demoStore";

function PatientRecordDetailPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { recordId } = useParams();
  const [record, setRecord] = useState(location.state?.record || null);
  const [activeAppointment, setActiveAppointment] = useState(null);
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

  useEffect(() => {
    if (!user) return;

    getAppointmentsForPatient(user.id)
      .then((appointments) => {
        const appointment =
          appointments.find((item) => item.status === "Booked" || item.status === "Rescheduled") || null;
        setActiveAppointment(appointment);
      })
      .catch(() => setActiveAppointment(null));
  }, [user]);

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

      {(record.followUpAction || record.followUpDueDate) && (
        <Card sx={{ mt: 3, boxShadow: "none", border: "1px solid #e0e6ea" }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Patient Follow-Up
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Doctor selected: {record.followUpAction || record.alertStatus || "Review needed"}
            </Typography>

            {record.followUpAction?.toLowerCase().includes("video") && (
              <Stack spacing={1.5}>
                <Alert severity="warning">
                  Please upload another video assessment so the doctor can review your mobility test again.
                </Alert>
                <Button variant="contained" onClick={() => navigate("/patient/upload")}>
                  Upload Reply Video
                </Button>
              </Stack>
            )}

            {record.followUpAction?.toLowerCase().includes("appointment") && (
              <Stack spacing={1.5}>
                <Alert severity="warning">
                  Please book an appointment within the requested follow-up window.
                </Alert>
                {activeAppointment ? (
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Reply: booked on {activeAppointment.date} at {activeAppointment.time}.
                  </Typography>
                ) : (
                  <Button variant="contained" onClick={() => navigate("/patient/book-appointment")}>
                    Open Calendar To Book
                  </Button>
                )}
              </Stack>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

export default PatientRecordDetailPage;

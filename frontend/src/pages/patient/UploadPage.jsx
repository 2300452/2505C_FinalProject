import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { getAppointmentsForPatient, uploadMedicalRecordVideo } from "../../services/demoStore";
import VideoDropzone from "../../components/upload/VideoDropzone";

function UploadPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [testType, setTestType] = useState("TUG");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setMessage("");
    setSuccess("");

    if (!file) {
      setMessage("Please choose a video file.");
      return;
    }

    setIsSubmitting(true);

    try {
      const patientAppointments = await getAppointmentsForPatient(user.id);
      const assignedDoctorId = patientAppointments[0]?.doctorId || "";

      await uploadMedicalRecordVideo({
        patientId: user.id,
        doctorId: assignedDoctorId,
        testType,
        file,
      });

      setSuccess("Assessment uploaded successfully. The record is now saved.");
      setTimeout(() => navigate("/patient/dashboard"), 1200);
    } catch (error) {
      setMessage(error.message || "Failed to upload video.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Upload Video Assessment
      </Typography>

      {message && <Alert severity="error" sx={{ mb: 2 }}>{message}</Alert>}
      {success && <Alert severity={success.includes("Fail") ? "warning" : "success"} sx={{ mb: 2 }}>{success}</Alert>}

      <Card sx={{ maxWidth: 700 }}>
        <CardContent>
          <Stack spacing={2}>
            <TextField
              select
              label="Test Type"
              value={testType}
              onChange={(e) => setTestType(e.target.value)}
            >
              <MenuItem value="TUG">Timed Up and Go (TUG)</MenuItem>
              <MenuItem value="5xSTS">Five Times Sit to Stand (5xSTS)</MenuItem>
            </TextField>

            <VideoDropzone file={file} onChange={setFile} />

            <Typography variant="body2" color="text.secondary">
              Upload and analyse your assessment video. The medical record will include the video and the assessed results.
            </Typography>

            <Button variant="contained" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Uploading..." : "Upload and Analyse"}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

export default UploadPage;

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { getAppointmentConsultation, saveAppointmentConsultation } from "../../services/demoStore";
import { useAuth } from "../../contexts/AuthContext";

function createMedicationRow() {
  return {
    medication_name: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
  };
}

function formatDateTime(value) {
  if (!value) return "No previous consultation";
  return new Date(value).toLocaleString();
}

export default function DoctorConsultationPage() {
  const navigate = useNavigate();
  const { appointmentId } = useParams();
  const { user } = useAuth();
  const [payload, setPayload] = useState(null);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    medicalRecordId: "",
    symptoms: "",
    duration: "",
    painLevel: "",
    patientComplaints: "",
    bloodPressure: "",
    heartRate: "",
    physicalFindings: "",
    diagnosis: "",
    conditionSeverity: "",
    assessmentNotes: "",
    medications: [createMedicationRow()],
    followUpDate: "",
    priority: "Normal",
    notesToPatient: "",
    alertFlags: [],
  });

  useEffect(() => {
    getAppointmentConsultation(appointmentId)
      .then((data) => {
        setPayload(data);
        const consultation = data.consultation || {};
        setForm({
          medicalRecordId: consultation.medicalRecordId || "",
          symptoms: consultation.symptoms || "",
          duration: consultation.duration || "",
          painLevel: consultation.painLevel ?? "",
          patientComplaints: consultation.patientComplaints || "",
          bloodPressure: consultation.bloodPressure || "",
          heartRate: consultation.heartRate || "",
          physicalFindings: consultation.physicalFindings || "",
          diagnosis: consultation.diagnosis || "",
          conditionSeverity: consultation.conditionSeverity || "",
          assessmentNotes: consultation.assessmentNotes || "",
          medications: consultation.medications?.length ? consultation.medications : [createMedicationRow()],
          followUpDate: consultation.followUpDate || "",
          priority: consultation.priority || "Normal",
          notesToPatient: consultation.notesToPatient || "",
          alertFlags: consultation.alertFlags || [],
        });
      })
      .catch((error) => setMessage(error.message));
  }, [appointmentId]);

  const patient = payload?.patient;
  const latestRecord = payload?.latestRecord;
  const appointment = payload?.appointment;

  const derivedAlertFlags = useMemo(() => {
    const flags = new Set(form.alertFlags || []);
    if (latestRecord?.result === "Fail") {
      flags.add("Failed mobility test - Recommend earlier review");
    }
    return [...flags];
  }, [form.alertFlags, latestRecord]);

  const handleMedicationChange = (index, field, value) => {
    setForm((current) => ({
      ...current,
      medications: current.medications.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addMedicationRow = () => {
    setForm((current) => ({
      ...current,
      medications: [...current.medications, createMedicationRow()],
    }));
  };

  const handleSave = async () => {
    try {
      const medications = form.medications.filter((item) => item.medication_name.trim());
      await saveAppointmentConsultation(appointmentId, {
        doctorUserId: user.id,
        medicalRecordId: form.medicalRecordId || null,
        symptoms: form.symptoms,
        duration: form.duration,
        painLevel: form.painLevel === "" ? null : Number(form.painLevel),
        patientComplaints: form.patientComplaints,
        bloodPressure: form.bloodPressure,
        heartRate: form.heartRate,
        physicalFindings: form.physicalFindings,
        diagnosis: form.diagnosis,
        conditionSeverity: form.conditionSeverity,
        assessmentNotes: form.assessmentNotes,
        medications,
        followUpDate: form.followUpDate,
        priority: form.priority,
        notesToPatient: form.notesToPatient,
        alertFlags: derivedAlertFlags,
      });
      navigate("/doctor/appointments");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleDownload = () => {
    if (!patient || !appointment) return;
    const lines = [
      `Patient ID: ${patient.generatedId}`,
      `Age/Gender: ${patient.age ?? "-"} / ${patient.gender || "-"}`,
      `Appointment: ${appointment.date} ${appointment.time}`,
      `Allergies: ${patient.allergies || "None"}`,
      `Existing conditions: ${patient.existingConditions || "None"}`,
      "",
      "SOAP",
      `S: ${form.symptoms}`,
      `Duration: ${form.duration}`,
      `Pain level: ${form.painLevel || "-"}`,
      `Complaints: ${form.patientComplaints}`,
      `O: BP ${form.bloodPressure} | HR ${form.heartRate}`,
      `Physical findings: ${form.physicalFindings}`,
      `Last video result: ${latestRecord?.result || "-"} ${latestRecord?.analysis?.analysis?.total_time_s ?? ""}`.trim(),
      `A: ${form.diagnosis}`,
      `Severity: ${form.conditionSeverity}`,
      `Notes: ${form.assessmentNotes}`,
      `P: Follow-up ${form.followUpDate || "-"}`,
      `Notes to patient: ${form.notesToPatient}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `consultation_${patient.generatedId}_${appointmentId}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (!payload && !message) {
    return <Typography>Loading consultation...</Typography>;
  }

  if (!payload) {
    return <Alert severity="info">{message || "Consultation could not be loaded."}</Alert>;
  }

  return (
    <Box>
      <Button sx={{ mb: 2 }} onClick={() => navigate("/doctor/appointments")}>
        Back to appointments
      </Button>
      {message && <Alert severity="info" sx={{ mb: 2 }}>{message}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Patient Info
              </Typography>
              <Stack spacing={1}>
                <Typography><strong>Patient ID:</strong> {patient.generatedId}</Typography>
                <Typography><strong>Age / Gender:</strong> {patient.age ?? "-"} / {patient.gender || "-"}</Typography>
                <Typography color={patient.allergies ? "error" : "text.primary"}>
                  <strong>Allergies:</strong> {patient.allergies || "None"}
                </Typography>
                <Typography><strong>Existing Conditions:</strong> {patient.existingConditions || "None"}</Typography>
                <Typography><strong>Last Visit:</strong> {formatDateTime(payload.lastVisitDate)}</Typography>
                <Typography><strong>Appointment Slot:</strong> {appointment.date} {appointment.time}</Typography>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Alerts / Flags
              </Typography>
              <Stack spacing={1}>
                {derivedAlertFlags.length === 0 ? (
                  <Typography>No automatic alerts.</Typography>
                ) : (
                  derivedAlertFlags.map((flag) => (
                    <Alert key={flag} severity={flag.includes("Failed") ? "warning" : "info"}>
                      {flag}
                    </Alert>
                  ))
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Consultation Notes
              </Typography>

              <Stack spacing={3}>
                <Box>
                  <Typography variant="h6" gutterBottom>S - Subjective</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Symptoms" value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Duration" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField fullWidth type="number" label="Pain Level (1-10)" value={form.painLevel} onChange={(e) => setForm({ ...form, painLevel: e.target.value })} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth multiline minRows={3} label="Patient Complaints" value={form.patientComplaints} onChange={(e) => setForm({ ...form, patientComplaints: e.target.value })} />
                    </Grid>
                  </Grid>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="h6" gutterBottom>O - Objective</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <TextField fullWidth label="BP" value={form.bloodPressure} onChange={(e) => setForm({ ...form, bloodPressure: e.target.value })} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField fullWidth label="Heart Rate" value={form.heartRate} onChange={(e) => setForm({ ...form, heartRate: e.target.value })} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        select
                        fullWidth
                        label="Last Video Test"
                        value={form.medicalRecordId || ""}
                        onChange={(e) => setForm({ ...form, medicalRecordId: e.target.value })}
                      >
                        <MenuItem value="">None</MenuItem>
                        {latestRecord && (
                          <MenuItem value={latestRecord.id}>
                            Assessment {latestRecord.assessmentNumber ?? latestRecord.id} - {latestRecord.result}
                          </MenuItem>
                        )}
                      </TextField>
                    </Grid>
                    {latestRecord && (
                      <Grid item xs={12}>
                        <Alert severity={latestRecord.result === "Fail" ? "warning" : "success"}>
                          Last video result: {latestRecord.result} • Time taken: {latestRecord.analysis?.analysis?.total_time_s ?? latestRecord.durationSeconds ?? "-"}s
                        </Alert>
                      </Grid>
                    )}
                    <Grid item xs={12}>
                      <TextField fullWidth multiline minRows={3} label="Physical Findings" value={form.physicalFindings} onChange={(e) => setForm({ ...form, physicalFindings: e.target.value })} />
                    </Grid>
                  </Grid>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="h6" gutterBottom>A - Assessment</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Diagnosis" value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Condition Severity" value={form.conditionSeverity} onChange={(e) => setForm({ ...form, conditionSeverity: e.target.value })} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth multiline minRows={3} label="Assessment Notes" value={form.assessmentNotes} onChange={(e) => setForm({ ...form, assessmentNotes: e.target.value })} />
                    </Grid>
                  </Grid>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="h6" gutterBottom>P - Plan / Medication</Typography>
                  <Stack spacing={2}>
                    {form.medications.map((medication, index) => (
                      <Grid container spacing={2} key={`med-${index}`}>
                        <Grid item xs={12} md={3}>
                          <TextField fullWidth label="Medication Name" value={medication.medication_name} onChange={(e) => handleMedicationChange(index, "medication_name", e.target.value)} />
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <TextField fullWidth label="Dosage" value={medication.dosage} onChange={(e) => handleMedicationChange(index, "dosage", e.target.value)} />
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <TextField fullWidth label="Frequency" value={medication.frequency} onChange={(e) => handleMedicationChange(index, "frequency", e.target.value)} />
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <TextField fullWidth label="Duration" value={medication.duration} onChange={(e) => handleMedicationChange(index, "duration", e.target.value)} />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <TextField fullWidth label="Instructions" value={medication.instructions} onChange={(e) => handleMedicationChange(index, "instructions", e.target.value)} />
                        </Grid>
                      </Grid>
                    ))}
                    <Button variant="outlined" onClick={addMedicationRow}>+ Add Medication</Button>
                  </Stack>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="h6" gutterBottom>Follow-Up & Actions</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <TextField type="date" fullWidth label="Next Appointment Date" InputLabelProps={{ shrink: true }} value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField select fullWidth label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                        <MenuItem value="Normal">Normal</MenuItem>
                        <MenuItem value="Urgent">Urgent</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth multiline minRows={3} label="Notes to Patient" value={form.notesToPatient} onChange={(e) => setForm({ ...form, notesToPatient: e.target.value })} />
                    </Grid>
                  </Grid>
                </Box>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <Button variant="contained" onClick={handleSave}>Save Consultation</Button>
                  <Button variant="outlined" onClick={handleSave}>Prescribe Medication</Button>
                  <Button variant="outlined" onClick={handleSave}>Schedule Follow-up</Button>
                  <Button variant="outlined" onClick={handleDownload}>Download Report</Button>
                  <Button variant="text" onClick={() => navigate(`/doctor/patients/${patient.id}`)}>View Past Records</Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

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
    template: "",
    medication_name: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
  };
}

const MEDICATION_TEMPLATES = [
  {
    label: "Paracetamol 500mg",
    medication_name: "Paracetamol",
    dosage: "500mg",
    frequency: "2x daily",
    duration: "5 days",
    instructions: "After meals",
  },
  {
    label: "Ibuprofen 200mg",
    medication_name: "Ibuprofen",
    dosage: "200mg",
    frequency: "3x daily",
    duration: "3 days",
    instructions: "After meals. Avoid if gastric symptoms.",
  },
  {
    label: "Diclofenac Gel",
    medication_name: "Diclofenac Gel",
    dosage: "Apply thin layer",
    frequency: "3x daily",
    duration: "7 days",
    instructions: "Apply to painful area only.",
  },
  {
    label: "Calcium + Vitamin D",
    medication_name: "Calcium + Vitamin D",
    dosage: "1 tablet",
    frequency: "1x daily",
    duration: "30 days",
    instructions: "Take after breakfast.",
  },
  {
    label: "Omeprazole 20mg",
    medication_name: "Omeprazole",
    dosage: "20mg",
    frequency: "1x daily",
    duration: "7 days",
    instructions: "Take before food.",
  },
  {
    label: "Other / manual entry",
    medication_name: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
  },
];

const TOSP_CODES = [
  { code: "TOSP-2F-001", description: "Standard doctor consultation", amount: 45 },
  { code: "TOSP-2F-014", description: "Mobility assessment review", amount: 30 },
  { code: "TOSP-2F-021", description: "Medication prescription handling", amount: 15 },
  { code: "TOSP-2F-032", description: "Follow-up appointment coordination", amount: 20 },
  { code: "TOSP-2F-046", description: "Video assessment clinical interpretation", amount: 35 },
];

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
    tospCodes: [],
    tospSearch: "",
    billProviderEmail: "",
    billStatus: "",
    billSentAt: "",
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
          tospCodes: consultation.tospCodes || [],
          tospSearch: "",
          billProviderEmail: consultation.billProviderEmail || "",
          billStatus: consultation.billStatus || "",
          billSentAt: consultation.billSentAt || "",
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

  const handleMedicationTemplateChange = (index, value) => {
    const template = MEDICATION_TEMPLATES.find((item) => item.label === value);
    setForm((current) => ({
      ...current,
      medications: current.medications.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              template: value,
              medication_name: template?.medication_name ?? item.medication_name,
              dosage: template?.dosage ?? item.dosage,
              frequency: template?.frequency ?? item.frequency,
              duration: template?.duration ?? item.duration,
              instructions: template?.instructions ?? item.instructions,
            }
          : item
      ),
    }));
  };

  const addMedicationRow = () => {
    setForm((current) => ({
      ...current,
      medications: [...current.medications, createMedicationRow()],
    }));
  };

  const selectedTospTotal = form.tospCodes.reduce(
    (total, item) => total + Number(item.amount || 0),
    0
  );

  const filteredTospCodes = TOSP_CODES.filter((item) => {
    const query = form.tospSearch.trim().toLowerCase();
    if (!query) return true;
    return item.code.toLowerCase().includes(query) || item.description.toLowerCase().includes(query);
  });

  const toggleTospCode = (item) => {
    setForm((current) => {
      const alreadySelected = current.tospCodes.some((selected) => selected.code === item.code);
      return {
        ...current,
        tospCodes: alreadySelected
          ? current.tospCodes.filter((selected) => selected.code !== item.code)
          : [...current.tospCodes, item],
      };
    });
  };

  const buildConsultationPayload = (sendBillEmail = false) => {
    const medications = form.medications.filter((item) => item.medication_name.trim());
    return {
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
      tospCodes: form.tospCodes,
      billProviderEmail: form.billProviderEmail,
      sendBillEmail,
    };
  };

  const handleCompleteConsultation = async () => {
    if (form.tospCodes.length === 0) {
      setMessage("Please select at least one TOSP code before completing the consultation.");
      return;
    }

    try {
      const result = await saveAppointmentConsultation(appointmentId, buildConsultationPayload(true));
      setForm((current) => ({
        ...current,
        billStatus: result.consultation?.billStatus || "Email sent to healthcare provider and patient",
        billSentAt: result.consultation?.billSentAt || new Date().toISOString(),
      }));
      navigate("/doctor/appointments");
    } catch (error) {
      setMessage(error.message);
    }
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
                        <Grid item xs={12} md={4}>
                          <TextField
                            select
                            fullWidth
                            label="Medication Template"
                            value={medication.template || ""}
                            onChange={(e) => handleMedicationTemplateChange(index, e.target.value)}
                          >
                            <MenuItem value="">Select medication</MenuItem>
                            {MEDICATION_TEMPLATES.map((item) => (
                              <MenuItem key={item.label} value={item.label}>
                                {item.label}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                        <Grid item xs={12} md={2}>
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
                        <Grid item xs={12} md={2}>
                          <TextField fullWidth label="Instructions" value={medication.instructions} onChange={(e) => handleMedicationChange(index, "instructions", e.target.value)} />
                        </Grid>
                      </Grid>
                    ))}
                    <Button variant="outlined" onClick={addMedicationRow}>+ Add Medication</Button>
                  </Stack>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="h6" gutterBottom>Billing / TOSP Codes</Typography>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Completing the consultation will generate the bill, simulate emailing it to the provider and patient, and show it in Medical Records and Billing.
                  </Alert>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={7}>
                      <TextField
                        fullWidth
                        label="Lookup TOSP Code"
                        placeholder="Search by code or description"
                        value={form.tospSearch}
                        onChange={(e) => setForm({ ...form, tospSearch: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} md={5}>
                      <TextField
                        fullWidth
                        label="Healthcare Provider Email"
                        value={form.billProviderEmail}
                        onChange={(e) => setForm({ ...form, billProviderEmail: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Stack spacing={1}>
                        {filteredTospCodes.map((item) => {
                          const selected = form.tospCodes.some((selectedItem) => selectedItem.code === item.code);
                          return (
                            <Box
                              key={item.code}
                              sx={{
                                p: 1.5,
                                borderRadius: 2,
                                border: "1px solid #dde5ea",
                                bgcolor: selected ? "#eaf8f4" : "#ffffff",
                              }}
                            >
                              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                                <Box>
                                  <Typography sx={{ fontWeight: 700 }}>
                                    {item.code} - {item.description}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Amount: ${Number(item.amount || 0).toFixed(2)}
                                  </Typography>
                                </Box>
                                <Button variant={selected ? "contained" : "outlined"} onClick={() => toggleTospCode(item)}>
                                  {selected ? "Remove Code" : "Add Code"}
                                </Button>
                              </Stack>
                            </Box>
                          );
                        })}
                      </Stack>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        Selected TOSP total: ${selectedTospTotal.toFixed(2)}
                      </Typography>
                      {form.tospCodes.length === 0 ? (
                        <Alert severity="warning" sx={{ mt: 1 }}>
                          No TOSP code selected yet. Select at least one code before completing the consultation.
                        </Alert>
                      ) : (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="subtitle2">Selected TOSP Codes</Typography>
                          {form.tospCodes.map((item) => (
                            <Typography key={item.code} variant="body2">
                              {item.code} - {item.description} - ${Number(item.amount || 0).toFixed(2)}
                            </Typography>
                          ))}
                        </Box>
                      )}
                      <Typography variant="body2" color="text.secondary">
                        Email status: {form.billStatus || "Not sent"}
                        {form.billSentAt ? ` at ${new Date(form.billSentAt).toLocaleString()}` : ""}
                      </Typography>
                    </Grid>
                  </Grid>
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

                <Button variant="contained" size="large" onClick={handleCompleteConsultation}>
                  Complete Consultation
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

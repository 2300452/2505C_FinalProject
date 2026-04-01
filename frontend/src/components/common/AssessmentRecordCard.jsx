import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import BenchmarkGauge from "../dashboard/BenchmarkGauge";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== "undefined" ? "http://localhost:8000" : "");

const PHASE_LABELS = {
  initial_sit: "Initial Sit",
  rising: "Rising",
  walk_forward: "Walk Forward",
  turn: "Turn",
  walk_back: "Walk Back",
  sit_down: "Sit Down",
};

function getVideoSrc(videoUrl) {
  if (!videoUrl) return null;
  if (videoUrl.startsWith("http://") || videoUrl.startsWith("https://")) {
    return videoUrl;
  }
  if (typeof window === "undefined") {
    return videoUrl;
  }

  const resolvedApiUrl = new URL(API_BASE_URL || window.location.origin, window.location.origin);
  return new URL(videoUrl, resolvedApiUrl.origin).toString();
}

function getVideoMimeType(fileName = "") {
  const lowerName = fileName.toLowerCase();
  if (lowerName.endsWith(".mp4")) return "video/mp4";
  if (lowerName.endsWith(".mov")) return "video/quicktime";
  if (lowerName.endsWith(".webm")) return "video/webm";
  if (lowerName.endsWith(".avi")) return "video/x-msvideo";
  if (lowerName.endsWith(".mkv")) return "video/x-matroska";
  return undefined;
}

function renderAnalysis(record) {
  if (record.testType === "Consultation" && record.consultation) {
    const consultation = record.consultation;
    return (
      <Stack spacing={2}>
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            SOAP Summary
          </Typography>
          <Typography variant="body2"><strong>S:</strong> {consultation.symptoms || "-"}</Typography>
          <Typography variant="body2"><strong>Duration:</strong> {consultation.duration || "-"}</Typography>
          <Typography variant="body2"><strong>Pain Level:</strong> {consultation.painLevel ?? "-"}</Typography>
          <Typography variant="body2"><strong>Complaints:</strong> {consultation.patientComplaints || "-"}</Typography>
          <Typography variant="body2"><strong>O:</strong> BP {consultation.bloodPressure || "-"} | HR {consultation.heartRate || "-"}</Typography>
          <Typography variant="body2"><strong>Physical Findings:</strong> {consultation.physicalFindings || "-"}</Typography>
          <Typography variant="body2"><strong>A:</strong> {consultation.diagnosis || "-"}</Typography>
          <Typography variant="body2"><strong>Severity:</strong> {consultation.conditionSeverity || "-"}</Typography>
          <Typography variant="body2"><strong>Plan Notes:</strong> {consultation.assessmentNotes || "-"}</Typography>
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Medications
          </Typography>
          {consultation.medications?.length ? (
            <Stack spacing={0.5}>
              {consultation.medications.map((medication, index) => (
                <Typography key={`${medication.medication_name}-${index}`} variant="body2">
                  {medication.medication_name} • {medication.dosage || "-"} • {medication.frequency || "-"} • {medication.duration || "-"} • {medication.instructions || "-"}
                </Typography>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2">No medication prescribed.</Typography>
          )}
        </Box>

        <Box>
          <Typography variant="body2"><strong>Follow-Up Date:</strong> {consultation.followUpDate || "-"}</Typography>
          <Typography variant="body2"><strong>Priority:</strong> {consultation.priority || "-"}</Typography>
          <Typography variant="body2"><strong>Notes to Patient:</strong> {consultation.notesToPatient || "-"}</Typography>
        </Box>
      </Stack>
    );
  }

  const analysis = record.analysis?.analysis;
  const poseSummary = record.analysis?.pose_summary;

  if (!analysis) {
    return (
      <Stack spacing={0.5}>
        <Typography variant="body2">Stand Time: {record.standTime ?? "-"}s</Typography>
        <Typography variant="body2">Walk Time: {record.walkTime ?? "-"}s</Typography>
        <Typography variant="body2">Sit Time: {record.sitTime ?? "-"}s</Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="body2" color="text.secondary">
          Score
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {analysis.total_time_s ?? "-"}s
        </Typography>
        {analysis.risk_label && (
          <Typography variant="body2" color="text.secondary">
            {analysis.risk_label}
          </Typography>
        )}
        {analysis.total_time_s != null && (
          <BenchmarkGauge testType={record.testType} totalTimeS={analysis.total_time_s} />
        )}
      </Box>

      {Array.isArray(analysis.phases) && analysis.phases.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Phase Breakdown
          </Typography>
          <Stack spacing={0.75}>
            {analysis.phases
              .filter((phase) => phase.name !== "initial_sit")
              .map((phase) => (
                <Stack
                  key={phase.name}
                  direction="row"
                  justifyContent="space-between"
                  spacing={1}
                >
                  <Typography variant="body2">
                    {PHASE_LABELS[phase.name] || phase.name}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {phase.duration_s}s
                  </Typography>
                </Stack>
              ))}
          </Stack>
        </Box>
      )}

      {Array.isArray(analysis.repetitions) && analysis.repetitions.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Repetition Breakdown
          </Typography>
          <Stack spacing={0.75}>
            {analysis.repetitions.map((rep) => (
              <Stack
                key={rep.rep_number}
                direction="row"
                justifyContent="space-between"
                spacing={1}
              >
                <Typography variant="body2">Rep {rep.rep_number}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {rep.duration_s}s
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      )}

      {poseSummary && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Pose Detection
          </Typography>
          <Typography variant="body2">
            Frames analysed: {poseSummary.total_frames}
          </Typography>
          <Typography variant="body2">
            Pose detected: {poseSummary.detected_frames} ({((poseSummary.detection_rate || 0) * 100).toFixed(1)}%)
          </Typography>
        </Box>
      )}

      {Array.isArray(analysis.notes) && analysis.notes.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Analysis Notes
          </Typography>
          <Stack spacing={0.5}>
            {analysis.notes.map((note, index) => (
              <Typography key={`${note}-${index}`} variant="body2">
                {note}
              </Typography>
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  );
}

export default function AssessmentRecordCard({
  record,
  index,
  noteValue = "",
  onNoteChange,
  onAddNote,
  showNoteComposer = false,
}) {
  const videoSrc = getVideoSrc(record.videoUrl);
  const labelPrefix = record.testType === "Consultation" ? "Consultation" : "Assessment";
  const label = `${labelPrefix} ${record.assessmentNumber ?? index}`;

  return (
    <Accordion sx={{ border: "1px solid #ddd", boxShadow: "none", "&:before": { display: "none" } }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={1}
          sx={{ width: "100%", pr: 1 }}
        >
          <Stack spacing={0.25}>
            <Typography variant="h6">{label}</Typography>
            <Typography variant="body2" color="text.secondary">
              {record.createdAt ? new Date(record.createdAt).toLocaleString() : "-"}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Chip
              label={record.result || "Pending"}
              color={record.result === "Fail" ? "error" : record.result === "Pass" ? "success" : "default"}
              size="small"
            />
            {record.analysis?.analysis?.risk_category && (
              <Chip label={record.analysis.analysis.risk_category} size="small" variant="outlined" />
            )}
          </Stack>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <AssessmentRecordDetails
          record={record}
          videoSrc={videoSrc}
          noteValue={noteValue}
          onNoteChange={onNoteChange}
          onAddNote={onAddNote}
          showNoteComposer={showNoteComposer}
        />
      </AccordionDetails>
    </Accordion>
  );
}

export function AssessmentRecordDetails({
  record,
  videoSrc = getVideoSrc(record.videoUrl),
  noteValue = "",
  onNoteChange,
  onAddNote,
  showNoteComposer = false,
}) {
  const videoMimeType = getVideoMimeType(record.fileName);

  return (
    <>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {record.testType} • {record.createdAt ? new Date(record.createdAt).toLocaleString() : "-"}
      </Typography>

      <Stack spacing={1}>
        <Typography variant="body2">File: {record.fileName || "-"}</Typography>
        <Typography variant="body2">Duration: {record.durationSeconds ?? "-"}s</Typography>
        <Typography variant="body2">Resolution: {record.resolution || "-"}</Typography>
        <Typography variant="body2">FPS: {record.fps ?? "-"}</Typography>
        <Typography variant="body2">Doctor: {record.doctorName || "Not Assigned"}</Typography>
        {record.alertStatus && <Typography variant="body2">Alert Status: {record.alertStatus}</Typography>}
        {record.followUpAction && <Typography variant="body2">Follow Up: {record.followUpAction}</Typography>}
        {record.followUpDueDate && <Typography variant="body2">Follow Up Due: {record.followUpDueDate}</Typography>}
      </Stack>

      {videoSrc && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Uploaded Video
          </Typography>
          <Box
            component="video"
            controls
            preload="metadata"
            playsInline
            sx={{
              width: "100%",
              maxHeight: 360,
              borderRadius: 2,
              backgroundColor: "#000",
            }}
          >
            <source src={videoSrc} type={videoMimeType} />
            Your browser could not play this uploaded video.
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Video source: {record.fileName || "uploaded video"}
          </Typography>
        </Box>
      )}

      <Divider sx={{ my: 2 }} />
      {renderAnalysis(record)}

      {(record.notes || []).length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Doctor Notes
            </Typography>
            <Stack spacing={1}>
              {record.notes.map((note) => (
                <Box key={note.id} sx={{ border: "1px solid #ddd", borderRadius: 2, p: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {note.doctorName} {note.doctorGeneratedId ? `(${note.doctorGeneratedId})` : ""}
                  </Typography>
                  <Typography variant="body2">{note.text}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        </>
      )}

      {showNoteComposer && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Add Medical Record Note
            </Typography>
            <TextField
              label="Doctor note"
              multiline
              rows={3}
              fullWidth
              value={noteValue}
              onChange={(event) => onNoteChange?.(event.target.value)}
            />
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              onClick={() => onAddNote?.()}
            >
              Add Note
            </Button>
          </Box>
        </>
      )}
    </>
  );
}

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Divider,
  Stack,
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
  return `${API_BASE_URL}${videoUrl}`;
}

function renderAnalysis(record) {
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

export default function AssessmentRecordCard({ record, index }) {
  const videoSrc = getVideoSrc(record.videoUrl);
  const label = `Assessment ${index}`;

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
          <Typography variant="h6">{label}</Typography>
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
              src={videoSrc}
              sx={{
                width: "100%",
                maxHeight: 360,
                borderRadius: 2,
                backgroundColor: "#000",
              }}
            />
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
      </AccordionDetails>
    </Accordion>
  );
}

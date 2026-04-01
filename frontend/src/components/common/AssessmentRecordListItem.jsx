import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Card, CardActionArea, Chip, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

export default function AssessmentRecordListItem({
  title,
  subtitle,
  metadata,
  result,
  to,
  state,
}) {
  return (
    <Card sx={{ border: "1px solid #ddd", boxShadow: "none" }}>
      <CardActionArea component={RouterLink} to={to} state={state} sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="h6">{title}</Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {metadata && (
              <Typography variant="body2" color="text.secondary">
                {metadata}
              </Typography>
            )}
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={result || "Pending"}
              color={result === "Fail" ? "error" : result === "Pass" ? "success" : "default"}
              size="small"
            />
            <ChevronRightIcon color="action" />
          </Stack>
        </Stack>
      </CardActionArea>
    </Card>
  );
}

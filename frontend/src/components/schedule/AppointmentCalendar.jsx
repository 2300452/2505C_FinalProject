import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import {
  Box,
  Button,
  IconButton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { useMemo, useState } from "react";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SLOT_TIMES = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
];

function toDateKey(dateValue) {
  if (!dateValue) return "";
  const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildMonthDays(monthDate) {
  const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const startWeekday = start.getDay();
  const totalDays = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const cells = [];

  for (let index = 0; index < startWeekday; index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= totalDays; day += 1) {
    cells.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), day));
  }

  return cells;
}

function AppointmentCalendar({
  appointments = [],
  selectedDate,
  onDateSelect,
  selectedTime = "",
  onTimeSelect,
  readOnly = false,
  patientFriendly = false,
  title = "Calendar",
  highlightFullyBookedDates = true,
}) {
  const theme = useTheme();
  const shell = theme.palette.custom;
  const initialDate = selectedDate ? new Date(selectedDate) : new Date();
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(initialDate.getFullYear(), initialDate.getMonth(), 1)
  );

  const selectedDateKey = toDateKey(selectedDate);

  const bookedByDate = useMemo(() => {
    return appointments.reduce((accumulator, appointment) => {
      const key = appointment.date;
      if (!accumulator[key]) {
        accumulator[key] = new Set();
      }
      if (appointment.status === "Booked" || appointment.status === "Rescheduled") {
        accumulator[key].add(appointment.time);
      }
      return accumulator;
    }, {});
  }, [appointments]);

  const monthDays = useMemo(() => buildMonthDays(visibleMonth), [visibleMonth]);
  const selectedDayBookings = bookedByDate[selectedDateKey] || new Set();

  return (
    <Stack spacing={2}>
      <Box
        sx={{
          p: 2.5,
          borderRadius: 4,
          border: `1px solid ${shell.border}`,
          bgcolor: theme.palette.background.paper,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant={patientFriendly ? "h5" : "h6"} sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton
              onClick={() =>
                setVisibleMonth(
                  new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1)
                )
              }
            >
              <ChevronLeftRoundedIcon />
            </IconButton>
            <Typography sx={{ minWidth: 140, textAlign: "center", fontWeight: 700 }}>
              {visibleMonth.toLocaleString("en-US", { month: "long", year: "numeric" })}
            </Typography>
            <IconButton
              onClick={() =>
                setVisibleMonth(
                  new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1)
                )
              }
            >
              <ChevronRightRoundedIcon />
            </IconButton>
          </Stack>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            gap: 1,
          }}
        >
          {WEEKDAYS.map((weekday) => (
            <Typography
              key={weekday}
              variant="caption"
              sx={{ textAlign: "center", fontWeight: 700, color: "text.secondary", py: 1 }}
            >
              {weekday}
            </Typography>
          ))}

          {monthDays.map((dateItem, index) => {
            if (!dateItem) {
              return <Box key={`empty-${index}`} />;
            }

            const dateKey = toDateKey(dateItem);
            const isSelected = dateKey === selectedDateKey;
            const bookedSlots = bookedByDate[dateKey];
            const isFullyBooked =
              highlightFullyBookedDates &&
              bookedSlots &&
              bookedSlots.size >= SLOT_TIMES.length;

            return (
              <Button
                key={dateKey}
                onClick={() => onDateSelect?.(dateKey)}
                disabled={readOnly ? false : false}
                sx={{
                  minHeight: patientFriendly ? 68 : 54,
                  borderRadius: 3,
                  fontSize: patientFriendly ? 18 : 14,
                  fontWeight: 700,
                  color: isSelected ? "#ffffff" : shell.heading,
                  bgcolor: isSelected
                    ? shell.primary
                    : isFullyBooked
                      ? "#2a2a2a"
                      : shell.primarySoft,
                  opacity: isFullyBooked && !isSelected ? 0.9 : 1,
                  "&:hover": {
                    bgcolor: isSelected ? shell.primary : shell.secondary,
                  },
                }}
              >
                {dateItem.getDate()}
              </Button>
            );
          })}
        </Box>
      </Box>

      <Box
        sx={{
          p: 2.5,
          borderRadius: 4,
          border: `1px solid ${shell.border}`,
          bgcolor: theme.palette.background.paper,
        }}
      >
        <Typography variant={patientFriendly ? "h5" : "h6"} sx={{ fontWeight: 700, mb: 2 }}>
          Available Time Slots
        </Typography>
        <Typography
          variant={patientFriendly ? "body1" : "body2"}
          color="text.secondary"
          sx={{ mb: 2 }}
        >
          30-minute appointment slots. Dark slots are already taken.
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              md: "repeat(4, minmax(0, 1fr))",
            },
            gap: 1.5,
          }}
        >
          {SLOT_TIMES.map((slot) => {
            const isBooked = selectedDayBookings.has(slot);
            const isSelected = selectedTime === slot;
            const isDisabled = isBooked || (!selectedDateKey && !readOnly);

            return (
              <Button
                key={slot}
                onClick={() => onTimeSelect?.(slot)}
                disabled={isDisabled}
                sx={{
                  minHeight: patientFriendly ? 64 : 52,
                  borderRadius: 3,
                  fontSize: patientFriendly ? 18 : 14,
                  fontWeight: 700,
                  bgcolor: isBooked ? "#1f1f1f" : isSelected ? shell.primary : shell.primarySoft,
                  color: isBooked || isSelected ? "#ffffff" : shell.heading,
                  "&.Mui-disabled": {
                    bgcolor: isBooked ? "#1f1f1f" : shell.primarySoft,
                    color: isBooked ? "#ffffff" : shell.heading,
                    opacity: isBooked ? 1 : 0.95,
                  },
                }}
              >
                {slot}
              </Button>
            );
          })}
        </Box>
      </Box>
    </Stack>
  );
}

export default AppointmentCalendar;

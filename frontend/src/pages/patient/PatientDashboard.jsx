import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import { Box, Card, CardActionArea, CardContent, Grid, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { getAppointmentsForPatient, getRecordsForPatient } from "../../services/demoStore";
import { useEffect, useState } from "react";

function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myAppointments, setMyAppointments] = useState([]);
  const [myRecords, setMyRecords] = useState([]);
  const sideCardColor = "#39d2f4";

  const actions = [
    {
      title: "Upload Assessment",
      subtitle: "Submit your latest mobility test",
      icon: <UploadFileOutlinedIcon sx={{ fontSize: 46, color: "#ffffff" }} />,
      color: "#ffcb17",
      onClick: () => navigate("/patient/upload"),
    },
    {
      title: "Book Appointment",
      subtitle: "Choose a suitable time slot",
      icon: <FavoriteBorderOutlinedIcon sx={{ fontSize: 46, color: "#ffffff" }} />,
      color: "#ff8abb",
      onClick: () => navigate("/patient/book-appointment"),
    },
    {
      title: "Medical Records",
      subtitle: "Review your assessment results",
      icon: <DescriptionOutlinedIcon sx={{ fontSize: 46, color: "#ffffff" }} />,
      color: "#7c98ff",
      onClick: () => navigate("/patient/records"),
    },
    {
      title: "My Appointments",
      subtitle: "Review scheduled visits",
      icon: <CalendarMonthOutlinedIcon sx={{ fontSize: 46, color: "#ffffff" }} />,
      color: "#28c8c5",
      onClick: () => navigate("/patient/appointments"),
    },
  ];

  useEffect(() => {
    if (!user) return;
    Promise.all([getAppointmentsForPatient(user.id), getRecordsForPatient(user.id)])
      .then(([appointmentData, recordData]) => {
        setMyAppointments(appointmentData);
        setMyRecords(recordData);
      })
      .catch(() => {
        setMyAppointments([]);
        setMyRecords([]);
      });
  }, [user]);

  const nextAppointment = myAppointments.find((appointment) => appointment.status !== "Completed");
  const latestAlertRecord = [...myRecords]
    .sort((left, right) => new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime())
    .find((record) => record.followUpAction || record.alertStatus);

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Hello, Patient ID {user?.generatedId || "-"}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Choose what you want to do next.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} xl={8}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, minmax(0, 1fr))",
              },
              gap: 3,
              alignItems: "stretch",
            }}
          >
            {actions.map((action) => (
              <Box key={action.title}>
                <Card sx={{ borderRadius: 4, boxShadow: "none" }}>
                  <CardActionArea
                    onClick={action.onClick}
                    sx={{
                      minHeight: { xs: 220, md: 280 },
                      p: 4,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      bgcolor: action.color,
                    }}
                  >
                    <Box
                      sx={{
                        width: 92,
                        height: 92,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: "rgba(255,255,255,0.18)",
                      }}
                    >
                      {action.icon}
                    </Box>

                    <Box>
                      <Typography
                        variant="h4"
                        sx={{ color: "#ffffff", fontWeight: 800, lineHeight: 1.2, mb: 1.2 }}
                      >
                        {action.title}
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ color: "rgba(255,255,255,0.95)", lineHeight: 1.5 }}
                      >
                        {action.subtitle}
                      </Typography>
                    </Box>
                  </CardActionArea>
                </Card>
              </Box>
            ))}
          </Box>
        </Grid>

        <Grid item xs={12} xl={4}>
          <Box
            sx={{
              display: "grid",
              gap: 3,
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, minmax(0, 1fr))",
                xl: "1fr 1fr",
              },
              alignItems: "stretch",
            }}
          >
            <Box
              sx={{
                p: 3,
                borderRadius: 4,
                minHeight: 180,
                bgcolor: sideCardColor,
                color: "#ffffff",
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                Next Appointment
              </Typography>
              {nextAppointment ? (
                <>
                  <Typography variant="h6">{nextAppointment.date}</Typography>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    {nextAppointment.time}
                  </Typography>
                  <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.95)" }}>
                    Status: {nextAppointment.status}
                  </Typography>
                </>
              ) : (
                <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.95)" }}>
                  No appointment booked yet.
                </Typography>
              )}
            </Box>

            <Card sx={{ borderRadius: 4, boxShadow: "none", minHeight: 180 }}>
              <CardActionArea
                onClick={() => navigate(latestAlertRecord ? `/patient/records/${latestAlertRecord.id}` : "/patient/records")}
                sx={{
                  height: "100%",
                  p: 3,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  bgcolor: sideCardColor,
                }}
              >
                <Box
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "rgba(255,255,255,0.18)",
                  }}
                >
                  <ReportProblemOutlinedIcon sx={{ fontSize: 38, color: "#ffffff" }} />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ color: "#ffffff", fontWeight: 800, mb: 1 }}>
                    Assessment Alert
                  </Typography>
                  <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.95)" }}>
                    {latestAlertRecord?.followUpAction || latestAlertRecord?.alertStatus || "No active assessment alerts"}
                  </Typography>
                </Box>
              </CardActionArea>
            </Card>

            <Card sx={{ borderRadius: 4, boxShadow: "none", minHeight: 180 }}>
              <CardActionArea
                onClick={() => navigate("/patient/profile")}
                sx={{
                  height: "100%",
                  p: 3,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  bgcolor: sideCardColor,
                }}
              >
                <Box
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "rgba(255,255,255,0.18)",
                  }}
                >
                  <PersonOutlineOutlinedIcon sx={{ fontSize: 38, color: "#ffffff" }} />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ color: "#ffffff", fontWeight: 800, mb: 1 }}>
                    Profile
                  </Typography>
                  <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.95)" }}>
                    Update your personal details
                  </Typography>
                </Box>
              </CardActionArea>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

export default PatientDashboard;

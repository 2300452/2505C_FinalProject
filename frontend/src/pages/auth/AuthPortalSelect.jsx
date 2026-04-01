import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Container,
  Grid,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

function AuthPortalSelect() {
  const navigate = useNavigate();

  const options = [
    {
      title: "Patient",
      subtitle: "Individual user",
      icon: <FavoriteBorderOutlinedIcon sx={{ fontSize: 72, color: "#4a6fa5" }} />,
      onClick: () => navigate("/patient/login"),
    },
    {
      title: "Staff",
      subtitle: "Admin and doctor portal",
      icon: <BadgeOutlinedIcon sx={{ fontSize: 72, color: "#6d5c45" }} />,
      onClick: () => navigate("/staff/login"),
    },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        py: 6,
        background:
          "radial-gradient(circle at top, rgba(240,244,250,1) 0%, rgba(255,255,255,1) 55%)",
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: "center", mb: 8 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1.5 }}>
            Please select your account type
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Continue to the correct login portal for Patient Buddy
          </Typography>
        </Box>

        <Grid container spacing={5} justifyContent="center">
          {options.map((option) => (
            <Grid item xs={12} sm={6} md={5} lg={4} key={option.title}>
              <Card
                sx={{
                  border: "1px solid #d9d9d9",
                  boxShadow: "none",
                  borderRadius: 5,
                  transition: "transform 0.18s ease, box-shadow 0.18s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 12px 30px rgba(0, 0, 0, 0.08)",
                  },
                }}
              >
                <CardActionArea onClick={option.onClick}>
                  <CardContent
                    sx={{
                      minHeight: 340,
                      p: 5,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 3,
                    }}
                  >
                    <Box
                      sx={{
                        width: 148,
                        height: 148,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: "#f7f1e8",
                      }}
                    >
                      {option.icon}
                    </Box>

                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {option.title}
                    </Typography>

                    <Typography variant="h6" color="text.secondary" align="center">
                      {option.subtitle}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

export default AuthPortalSelect;

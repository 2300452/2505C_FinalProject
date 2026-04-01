import { Box, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

function Unauthorised() {
  const navigate = useNavigate();

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Unauthorized Access
      </Typography>
      <Typography sx={{ mb: 2 }}>
        You do not have permission to access this page.
      </Typography>
      <Button variant="contained" onClick={() => navigate("/")}>
        Back to Login
      </Button>
    </Box>
  );
}

export default Unauthorised;
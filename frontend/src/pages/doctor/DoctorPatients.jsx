import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { getPatients, getRecordsForPatient } from "../../services/demoStore";

function DoctorPatients() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    const loadPatients = async () => {
      const patientList = await getPatients();
      const data = await Promise.all(
        patientList.map(async (patient) => {
          const records = await getRecordsForPatient(patient.id);

          return {
            generatedId: patient.generatedId,
            id: patient.id,
            assessmentCount: records.length,
            medicalRecordCount: records.reduce(
              (total, record) => total + (record.notes?.length || 0),
              0
            ),
          };
        })
      );
      setPatients(data);
    };

    loadPatients().catch(() => setPatients([]));
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        Patient Cases
      </Typography>

      {patients.length === 0 ? (
        <Typography>No patients found.</Typography>
      ) : (
        <TableContainer
          component={Paper}
          sx={{ borderRadius: 3, overflow: "hidden" }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Patient ID</TableCell>
                <TableCell>No. of Medical Records</TableCell>
                <TableCell>No. of Assessments</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {patients.map((patient) => (
                <TableRow key={patient.id} hover>
                  <TableCell>{patient.generatedId}</TableCell>
                  <TableCell>{patient.medicalRecordCount}</TableCell>
                  <TableCell>{patient.assessmentCount}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      onClick={() => navigate(`/doctor/patients/${patient.id}`)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

export default DoctorPatients;

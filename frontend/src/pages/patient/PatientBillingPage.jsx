import { useEffect, useState } from "react";
import { Alert, Box, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";
import { getBillingForPatient, markBillingPaid } from "../../services/demoStore";

function PatientBillingPage() {
  const { user } = useAuth();
  const [bills, setBills] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) return;
    getBillingForPatient(user.id)
      .then(setBills)
      .catch((error) => setMessage(error.message));
  }, [user]);

  const handleMarkPaid = async (billId) => {
    try {
      const updatedBill = await markBillingPaid(billId, user.id);
      setBills((current) => current.map((bill) => (bill.id === billId ? updatedBill : bill)));
      setMessage("Bill marked as paid. Admin billing will reflect this status.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const totalOwed = bills.reduce(
    (total, bill) => total + (bill.patientBillStatus === "Paid" ? 0 : Number(bill.totalAmount || 0)),
    0
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Billing
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Review consultation billing and TOSP charges sent by the clinic.
      </Typography>

      {message && <Alert severity="info" sx={{ mb: 2 }}>{message}</Alert>}

      <Card sx={{ mb: 2, boxShadow: "none", border: "1px solid #dde5ea" }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary">Total Outstanding</Typography>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>${totalOwed.toFixed(2)}</Typography>
        </CardContent>
      </Card>

      {bills.length === 0 ? (
        <Alert severity="info">No bills found.</Alert>
      ) : (
        <Stack spacing={2}>
          {bills.map((bill) => (
            <Card key={bill.id} sx={{ boxShadow: "none", border: "1px solid #dde5ea" }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ mb: 1 }}>
                  <Box>
                    <Typography variant="h6">Consultation Bill #{bill.id}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Doctor ID: {bill.doctorGeneratedId || "-"}
                    </Typography>
                  </Box>
                  <Chip
                    label={bill.patientBillStatus || "Unpaid"}
                    color={bill.patientBillStatus === "Paid" ? "success" : "warning"}
                  />
                </Stack>

                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  ${Number(bill.totalAmount || 0).toFixed(2)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Provider email status: {bill.providerEmailStatus || "Not sent"}
                </Typography>
                {bill.patientBillPaidAt && (
                  <Typography variant="body2" color="success.main">
                    Paid on {new Date(bill.patientBillPaidAt).toLocaleString()}
                  </Typography>
                )}
                {bill.patientBillAlertSentAt && (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    Payment reminder sent on {new Date(bill.patientBillAlertSentAt).toLocaleString()}.
                  </Alert>
                )}

                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">TOSP Codes</Typography>
                  {bill.tospCodes.length === 0 ? (
                    <Typography variant="body2">No TOSP codes selected.</Typography>
                  ) : (
                    bill.tospCodes.map((item) => (
                      <Typography key={item.code} variant="body2">
                        {item.code} - {item.description} - ${Number(item.amount || 0).toFixed(2)}
                      </Typography>
                    ))
                  )}
                </Box>

                <Button
                  variant="contained"
                  sx={{ mt: 2 }}
                  disabled={bill.patientBillStatus === "Paid"}
                  onClick={() => handleMarkPaid(bill.id)}
                >
                  Bill Paid
                </Button>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
}

export default PatientBillingPage;

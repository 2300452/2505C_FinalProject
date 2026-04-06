import { useEffect, useState } from "react";
import { Alert, Box, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";
import { getAllBilling, sendBillingAlert } from "../../services/demoStore";

function AdminBillingPage() {
  const { user } = useAuth();
  const [bills, setBills] = useState([]);
  const [message, setMessage] = useState("");

  const loadBills = async () => {
    const data = await getAllBilling();
    setBills(data);
  };

  useEffect(() => {
    loadBills().catch((error) => setMessage(error.message));
  }, []);

  const handleSendAlert = async (billId) => {
    try {
      const updatedBill = await sendBillingAlert(billId, user.id);
      setBills((current) => current.map((bill) => (bill.id === billId ? updatedBill : bill)));
      setMessage("Payment alert sent to patient.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const totalOutstanding = bills.reduce(
    (total, bill) => total + (bill.patientBillStatus === "Paid" ? 0 : Number(bill.totalAmount || 0)),
    0
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Billing
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Track patient bills, TOSP charges, and payment reminder alerts.
      </Typography>

      {message && <Alert severity="info" sx={{ mb: 2 }}>{message}</Alert>}

      <Card sx={{ mb: 2, boxShadow: "none", border: "1px solid #dde5ea" }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary">Total Outstanding</Typography>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>${totalOutstanding.toFixed(2)}</Typography>
        </CardContent>
      </Card>

      {bills.length === 0 ? (
        <Alert severity="info">No bills found.</Alert>
      ) : (
        <Stack spacing={2}>
          {bills.map((bill) => (
            <Card key={bill.id} sx={{ boxShadow: "none", border: "1px solid #dde5ea" }}>
              <CardContent>
                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
                  <Box>
                    <Typography variant="h6">Bill #{bill.id}</Typography>
                    <Typography variant="body2">Patient: {bill.patientName} ({bill.patientGeneratedId})</Typography>
                    <Typography variant="body2">Doctor: {bill.doctorName} ({bill.doctorGeneratedId || "-"})</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Days owed: {bill.daysOwed}
                    </Typography>
                  </Box>
                  <Stack alignItems={{ xs: "flex-start", md: "flex-end" }} spacing={1}>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                      ${Number(bill.totalAmount || 0).toFixed(2)}
                    </Typography>
                    <Chip label={bill.patientBillStatus || "Unpaid"} color={bill.patientBillStatus === "Paid" ? "success" : "warning"} />
                    {bill.patientBillStatus !== "Paid" ? (
                      <Button variant="contained" onClick={() => handleSendAlert(bill.id)}>
                        Send Payment Alert
                      </Button>
                    ) : (
                      <Typography variant="body2" color="success.main">
                        Paid on {bill.patientBillPaidAt ? new Date(bill.patientBillPaidAt).toLocaleString() : "-"}
                      </Typography>
                    )}
                  </Stack>
                </Stack>

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
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
}

export default AdminBillingPage;

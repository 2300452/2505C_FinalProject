import { Box, Typography } from "@mui/material";

function buildQrCells(code) {
  const seed = String(code || "000000");
  return Array.from({ length: 49 }, (_, index) => {
    const charCode = seed.charCodeAt(index % seed.length);
    return (charCode + index * 7) % 3 !== 0;
  });
}

export default function DummyQrCode({ code }) {
  const cells = buildQrCells(code);
  const qrPayload = `PatientBuddy 2FA code: ${code}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrPayload)}`;

  return (
    <Box sx={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
      <Box
        sx={{
          width: 180,
          height: 180,
          p: 1,
          bgcolor: "#fff",
          border: "2px solid #111",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        aria-label={`Simulated QR code containing 2FA number ${code}`}
      >
        <Box
          component="img"
          src={qrImageUrl}
          alt={`QR code containing 2FA number ${code}`}
          sx={{ width: "100%", height: "100%", objectFit: "contain" }}
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 0.35,
          width: 80,
          height: 80,
          p: 0.75,
          border: "1px solid #ddd",
          bgcolor: "#fff",
        }}
        aria-hidden="true"
      >
        {cells.map((isDark, index) => (
          <Box key={index} sx={{ bgcolor: isDark ? "#111" : "#fff" }} />
        ))}
      </Box>
      <Typography variant="body2" color="text.secondary">
        Scan the QR code to view your 2FA number.
      </Typography>
    </Box>
  );
}

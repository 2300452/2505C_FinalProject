import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";
import {
  forceResetUserPassword,
  getUsers,
  permanentlyDeleteUser,
  recycleUser,
  restoreUser,
} from "../../services/demoStore";
import { useNavigate } from "react-router-dom";

function matchesSearch(user, search) {
  const text = [
    user.generatedId,
    user.name,
    user.email,
    user.specialty,
    user.designation,
    user.reportsToName,
    user.reportsToGeneratedId,
    user.role,
  ]
    .join(" ")
    .toLowerCase();

  return text.includes(search.toLowerCase());
}

function AdminUserList() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [tab, setTab] = useState(0);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const loadData = async () => {
    const userData = await getUsers(true);
    setUsers(userData);
  };

  useEffect(() => {
    loadData().catch((error) => setMessage(error.message));
  }, []);

  const filteredUsers = useMemo(() => {
    const matched = users.filter((item) => matchesSearch(item, search));
    if (tab === 0) return matched.filter((item) => item.role === "Admin" && !item.isDeleted);
    if (tab === 1) return matched.filter((item) => item.role === "Doctor" && !item.isDeleted);
    if (tab === 2) return matched.filter((item) => item.role === "Patient" && !item.isDeleted);
    return matched.filter((item) => item.isDeleted);
  }, [users, search, tab]);

  const handleReset = async (userId, name) => {
    try {
      await forceResetUserPassword(userId);
      setMessage(`Temporary password set for ${name}. Temporary password: Temp1234!`);
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleRecycle = async (userId) => {
    try {
      await recycleUser(userId);
      setMessage("User moved to archived accounts.");
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleRestore = async (userId) => {
    try {
      await restoreUser(userId);
      setMessage("User restored successfully.");
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handlePermanentDelete = async (userId) => {
    try {
      await permanentlyDeleteUser(userId, currentUser.id);
      setMessage("User permanently deleted.");
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const renderRows = (rowUsers, recycled = false) => {
    if (rowUsers.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={9}>No users found.</TableCell>
        </TableRow>
      );
    }

    return rowUsers.map((item) => (
      <TableRow key={item.id} hover>
        <TableCell>{item.generatedId}</TableCell>
        <TableCell>{item.name}</TableCell>
        <TableCell>{item.role}</TableCell>
        <TableCell>{item.email}</TableCell>
        <TableCell>{item.specialty || "-"}</TableCell>
        <TableCell>{item.designation || "-"}</TableCell>
        <TableCell>
          {item.reportsToName ? `${item.reportsToName} (${item.reportsToGeneratedId})` : "-"}
        </TableCell>
        <TableCell>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {item.isRootAdmin && <Chip size="small" label="Root Admin" color="warning" />}
            {item.mustChangePassword && <Chip size="small" label="Reset Pending" color="info" />}
          </Stack>
        </TableCell>
        <TableCell>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {!recycled && (
              <Button size="small" variant="text" onClick={() => navigate(`/admin/users/${item.id}`)}>
                View Profile
              </Button>
            )}
            {!recycled && (
              <Button size="small" variant="contained" onClick={() => handleReset(item.id, item.name)}>
                Reset Password
              </Button>
            )}
            {!recycled && !item.isRootAdmin && (
              <Button size="small" variant="outlined" color="warning" onClick={() => handleRecycle(item.id)}>
                Recycle
              </Button>
            )}
            {recycled && (
              <Button size="small" variant="contained" onClick={() => handleRestore(item.id)}>
                Restore
              </Button>
            )}
            {recycled && currentUser?.isRootAdmin && (
              <Button size="small" variant="outlined" color="error" onClick={() => handlePermanentDelete(item.id)}>
                Delete Permanently
              </Button>
            )}
          </Stack>
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Manage Users
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Search by ID, email, specialty, reporting manager, or designation.
      </Typography>

      {message && <Alert severity="info" sx={{ mb: 2 }}>{message}</Alert>}

      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          label="Search users"
          fullWidth
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="PAT1001, doctor@email.com, Neurology, Team Leader..."
        />
      </Paper>

      <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }}>
        <Tab label="Admins" />
        <Tab label="Doctors" />
        <Tab label="Patients" />
        <Tab label="Archived Accounts" />
      </Tabs>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Specialty</TableCell>
              <TableCell>Designation</TableCell>
              <TableCell>Reports To</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>{renderRows(filteredUsers, tab === 3)}</TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default AdminUserList;

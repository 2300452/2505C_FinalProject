import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import AppThemeProvider from "./theme/AppThemeProvider";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleRoute from "./components/auth/RoleRoute";
import Layout from "./components/Layout/Layout";

import AuthPortalSelect from "./pages/auth/AuthPortalSelect";
import Login from "./pages/auth/Login";
import Unauthorised from "./pages/auth/Unauthorised";
import PatientSignUp from "./pages/auth/PatientSignUp";
import ForgotPassword from "./pages/auth/ForgotPassword";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCreateUser from "./pages/admin/AdminCreateUser";
import AdminUserList from "./pages/admin/AdminUserList";
import AdminUserProfilePage from "./pages/admin/AdminUserProfilePage";

import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import DoctorPatients from "./pages/doctor/DoctorPatients";
import DoctorPatientRecord from "./pages/doctor/DoctorPatientRecord";
import DoctorAppointments from "./pages/doctor/DoctorAppointments";
import DoctorAlerts from "./pages/doctor/DoctorAlerts";
import DoctorAlertDetailPage from "./pages/doctor/DoctorAlertDetailPage";
import DoctorConsultationPage from "./pages/doctor/DoctorConsultationPage";

import PatientAppointmentsPage from "./pages/patient/PatientAppointmentsPage";
import PatientBookAppointmentPage from "./pages/patient/PatientBookAppointmentPage";
import PatientDashboard from "./pages/patient/PatientDashboard";
import PatientRecordsPage from "./pages/patient/PatientRecordsPage";
import PatientRecordDetailPage from "./pages/patient/PatientRecordDetailPage";
import UploadPage from "./pages/patient/UploadPage";
import UserProfilePage from "./pages/common/UserProfilePage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppThemeProvider>
          <Routes>
            <Route path="/" element={<AuthPortalSelect />} />
            <Route path="/staff/login" element={<Login portal="staff" />} />
            <Route path="/patient/login" element={<Login portal="patient" />} />
            <Route path="/signup" element={<PatientSignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/unauthorized" element={<Unauthorised />} />

            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={["Admin"]}>
                    <Layout>
                      <AdminDashboard />
                    </Layout>
                  </RoleRoute>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/create-user"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={["Admin"]}>
                    <Layout>
                      <AdminCreateUser />
                    </Layout>
                  </RoleRoute>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/users"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={["Admin"]}>
                    <Layout>
                      <AdminUserList />
                    </Layout>
                  </RoleRoute>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/users/:userId"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={["Admin"]}>
                    <Layout>
                      <AdminUserProfilePage />
                    </Layout>
                  </RoleRoute>
                </ProtectedRoute>
              }
            />

          <Route
            path="/doctor/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["Doctor"]}>
                  <Layout>
                    <DoctorDashboard />
                  </Layout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor/patients"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["Doctor"]}>
                  <Layout>
                    <DoctorPatients />
                  </Layout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor/patients/:patientId"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["Doctor"]}>
                  <Layout>
                    <DoctorPatientRecord />
                  </Layout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor/appointments"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["Doctor"]}>
                  <Layout>
                    <DoctorAppointments />
                  </Layout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor/appointments/:appointmentId/consultation"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["Doctor"]}>
                  <Layout>
                    <DoctorConsultationPage />
                  </Layout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor/alerts"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["Doctor"]}>
                  <Layout>
                    <DoctorAlerts />
                  </Layout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor/alerts/:recordId"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["Doctor"]}>
                  <Layout>
                    <DoctorAlertDetailPage />
                  </Layout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor/profile"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["Doctor"]}>
                  <Layout>
                    <UserProfilePage />
                  </Layout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/patient/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["Patient"]}>
                  <Layout>
                    <PatientDashboard />
                  </Layout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/patient/upload"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["Patient"]}>
                  <Layout>
                    <UploadPage />
                  </Layout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/patient/book-appointment"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["Patient"]}>
                  <Layout>
                    <PatientBookAppointmentPage />
                  </Layout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/patient/appointments"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["Patient"]}>
                  <Layout>
                    <PatientAppointmentsPage />
                  </Layout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/patient/records"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["Patient"]}>
                  <Layout>
                    <PatientRecordsPage />
                  </Layout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/patient/records/:recordId"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["Patient"]}>
                  <Layout>
                    <PatientRecordDetailPage />
                  </Layout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/patient/profile"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["Patient"]}>
                  <Layout>
                    <UserProfilePage />
                  </Layout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppThemeProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

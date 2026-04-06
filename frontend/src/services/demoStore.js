import api from "./api";

function toError(error, fallbackMessage) {
  const message = error?.response?.data?.detail || fallbackMessage;
  return new Error(message);
}

export async function initializeDemoData() {
  return null;
}

export async function getUsers(includeDeleted = false) {
  try {
    const response = await api.get("/admin/users", {
      params: { include_deleted: includeDeleted },
    });
    return response.data;
  } catch (error) {
    throw toError(error, "Failed to load users.");
  }
}

export async function saveUsers() {
  return null;
}

export async function getAppointments() {
  try {
    const response = await api.get("/data/appointments");
    return response.data;
  } catch (error) {
    throw toError(error, "Failed to load appointments.");
  }
}

export async function saveAppointments() {
  return null;
}

export async function getRecords() {
  try {
    const response = await api.get("/data/records");
    return response.data;
  } catch (error) {
    throw toError(error, "Failed to load medical records.");
  }
}

export async function saveRecords() {
  return null;
}

export async function authenticateUser({ portal, email, password, twoFactorCode }) {
  try {
    const response = await api.post("/auth/login", {
      portal,
      email,
      password,
      two_factor_code: twoFactorCode || null,
    });
    return response.data;
  } catch (error) {
    throw toError(error, "Invalid email or password.");
  }
}

export async function createStaffUser({
  role,
  name,
  email,
  password,
  phone = "",
  specialty = "",
  designation = "",
  reportsToUserId = null,
}) {
  try {
    const response = await api.post("/admin/users", {
      role,
      name,
      email,
      password,
      phone,
      specialty: specialty || null,
      designation: designation || null,
      reports_to_user_id: reportsToUserId ? Number(reportsToUserId) : null,
    });
    return response.data;
  } catch (error) {
    throw toError(error, "Failed to create staff user.");
  }
}

export async function createPatient({ name, email, password, dob, gender, phone, allergies, existingConditions }) {
  try {
    const response = await api.post("/auth/signup", {
      name,
      email,
      password,
      dob: dob || null,
      gender: gender || null,
      phone: phone || null,
      allergies: allergies || null,
      existing_conditions: existingConditions || null,
    });
    return response.data;
  } catch (error) {
    throw toError(error, "Failed to create patient.");
  }
}

export async function updateCurrentUserProfile(userId, updates) {
  try {
    const response = await api.patch(`/data/users/${userId}`, {
      name: updates.name ?? null,
      email: updates.email ?? null,
      phone: updates.phone ?? null,
      dob: updates.dob || null,
      gender: updates.gender || null,
      allergies: updates.allergies || null,
      existing_conditions: updates.existingConditions || null,
      specialty: updates.specialty || null,
    });
    return response.data;
  } catch (error) {
    throw toError(error, "Failed to update profile.");
  }
}

export async function updateManagedUserProfile(userId, updates) {
  try {
    const response = await api.patch(`/admin/users/${userId}`, {
      name: updates.name ?? null,
      email: updates.email ?? null,
      phone: updates.phone ?? null,
      dob: updates.dob || null,
      gender: updates.gender || null,
      allergies: updates.allergies || null,
      existing_conditions: updates.existingConditions || null,
      specialty: updates.specialty || null,
      designation: updates.designation || null,
      reports_to_user_id:
        updates.reportsToUserId === "" || updates.reportsToUserId == null
          ? null
          : Number(updates.reportsToUserId),
    });
    return response.data;
  } catch (error) {
    throw toError(error, "Failed to update user profile.");
  }
}

export async function getAdminUserProfile(userId) {
  try {
    const response = await api.get(`/admin/users/${userId}/profile`);
    return response.data;
  } catch (error) {
    throw toError(error, "Failed to load user profile.");
  }
}

export async function getDoctors() {
  try {
    const response = await api.get("/data/doctors");
    return response.data;
  } catch (error) {
    throw toError(error, "Failed to load doctors.");
  }
}

export async function getPatients() {
  try {
    const response = await api.get("/data/patients");
    return response.data;
  } catch (error) {
    throw toError(error, "Failed to load patients.");
  }
}

export async function getUserById(userId) {
  try {
    const response = await api.get(`/data/users/${userId}`);
    return response.data;
  } catch (error) {
    if (error?.response?.status === 404) {
      return null;
    }
    throw toError(error, "Failed to load user.");
  }
}

export async function getUserByGeneratedId() {
  return null;
}

export async function getAdmins(includeDeleted = false) {
  const users = await getUsers(includeDeleted);
  return users.filter((user) => user.role === "Admin");
}

export async function forceResetUserPassword(userId, newPassword = "Temp1234!") {
  try {
    const response = await api.post("/admin/force-reset", {
      user_id: userId,
      temporary_password: newPassword,
    });
    return response.data;
  } catch (error) {
    throw toError(error, "Failed to reset password.");
  }
}

export async function recycleUser(userId) {
  try {
    await api.post("/admin/users/recycle", { user_id: userId });
  } catch (error) {
    throw toError(error, "Failed to recycle user.");
  }
}

export async function restoreUser(userId) {
  try {
    await api.post("/admin/users/restore", { user_id: userId });
  } catch (error) {
    throw toError(error, "Failed to restore user.");
  }
}

export async function permanentlyDeleteUser(userId, actorUserId) {
  try {
    await api.delete(`/admin/users/${userId}`, {
      params: { actor_user_id: actorUserId },
    });
  } catch (error) {
    throw toError(error, "Failed to permanently delete user.");
  }
}

export async function requestPasswordReset(email, portal) {
  try {
    const response = await api.post("/auth/forgot-password", { email, portal });
    return response.data;
  } catch (error) {
    throw toError(error, "No matching account found.");
  }
}

export async function patientHasActiveAppointment(patientId) {
  const appointments = await getAppointmentsForPatient(patientId);
  return appointments.some(
    (appointment) => appointment.status === "Booked" || appointment.status === "Rescheduled"
  );
}

export async function createAppointment({ patientId, date, time }) {
  try {
    const response = await api.post("/data/appointments", {
      patient_user_id: patientId,
      appointment_date: date,
      appointment_time: `${time}:00`,
    });
    return response.data;
  } catch (error) {
    throw toError(error, "Failed to create appointment.");
  }
}

export async function rescheduleAppointment(appointmentId, date, time) {
  try {
    const response = await api.post("/admin/appointments/reschedule", {
      appointment_id: appointmentId,
      appointment_date: date,
      appointment_time: `${time}:00`,
    });
    return response.data;
  } catch (error) {
    throw toError(error, "Failed to reschedule appointment.");
  }
}

export async function doctorRescheduleAppointment(appointmentId, doctorId, date, time) {
  try {
    await rescheduleAppointment(appointmentId, date, time);
    const response = await api.post("/data/appointments/status", {
      appointment_id: appointmentId,
      doctor_user_id: doctorId,
      status: "Rescheduled",
    });
    return response.data;
  } catch (error) {
    throw toError(error, "Failed to reschedule appointment.");
  }
}

export async function completeAppointment(appointmentId, doctorId) {
  try {
    const response = await api.post("/data/appointments/status", {
      appointment_id: appointmentId,
      doctor_user_id: doctorId,
      status: "Completed",
    });
    return response.data;
  } catch (error) {
    throw toError(error, "Failed to complete appointment.");
  }
}

export async function getAppointmentConsultation(appointmentId) {
  try {
    const response = await api.get(`/data/appointments/${appointmentId}/consultation`);
    return response.data;
  } catch (error) {
    throw toError(error, "Failed to load consultation.");
  }
}

export async function saveAppointmentConsultation(appointmentId, payload) {
  try {
    const response = await api.post(`/data/appointments/${appointmentId}/consultation`, {
      doctor_user_id: payload.doctorUserId,
      medical_record_id: payload.medicalRecordId || null,
      symptoms: payload.symptoms || "",
      duration: payload.duration || "",
      pain_level: payload.painLevel ?? null,
      patient_complaints: payload.patientComplaints || "",
      blood_pressure: payload.bloodPressure || "",
      heart_rate: payload.heartRate || "",
      physical_findings: payload.physicalFindings || "",
      diagnosis: payload.diagnosis || "",
      condition_severity: payload.conditionSeverity || "",
      assessment_notes: payload.assessmentNotes || "",
      medications: payload.medications || [],
      follow_up_date: payload.followUpDate || null,
      priority: payload.priority || "Normal",
      notes_to_patient: payload.notesToPatient || "",
      alert_flags: payload.alertFlags || [],
      tosp_codes: payload.tospCodes || [],
      bill_provider_email: payload.billProviderEmail || "",
      send_bill_email: Boolean(payload.sendBillEmail),
    });
    return response.data;
  } catch (error) {
    throw toError(error, "Failed to save consultation.");
  }
}

export async function getAppointmentsForDoctor(doctorId) {
  try {
    const response = await api.get(`/data/appointments/doctor/${doctorId}`);
    return response.data;
  } catch (error) {
    throw toError(error, "Failed to load doctor appointments.");
  }
}

export async function getAppointmentsForPatient(patientId) {
  try {
    const response = await api.get(`/data/appointments/patient/${patientId}`);
    return response.data;
  } catch (error) {
    throw toError(error, "Failed to load patient appointments.");
  }
}

export async function createMedicalRecord({
  patientId,
  doctorId,
  testType,
  fileName,
  result,
  standTime,
  walkTime,
  sitTime,
}) {
  try {
    const response = await api.post("/data/records", {
      patient_user_id: patientId,
      doctor_user_id: doctorId || null,
      test_type: testType,
      file_name: fileName,
      result,
      stand_time: standTime,
      walk_time: walkTime,
      sit_time: sitTime,
    });
    return response.data;
  } catch (error) {
    throw toError(error, "Failed to create medical record.");
  }
}

export async function uploadMedicalRecordVideo({
  patientId,
  doctorId,
  testType,
  file,
}) {
  try {
    const formData = new FormData();
    formData.append("patient_user_id", String(patientId));
    if (doctorId) {
      formData.append("doctor_user_id", String(doctorId));
    }
    formData.append("test_type", testType);
    formData.append("file", file);

    const response = await api.post("/data/records/upload", formData);
    return response.data;
  } catch (error) {
    throw toError(error, "Failed to upload video.");
  }
}

export async function getRecordsForPatient(patientId) {
  try {
    const response = await api.get(`/data/records/patient/${patientId}`);
    return response.data;
  } catch (error) {
    throw toError(error, "Failed to load patient records.");
  }
}

export async function getAllRecords() {
  return getRecords();
}

export async function getRecordById(recordId) {
  try {
    const response = await api.get(`/data/records/${recordId}`);
    return response.data;
  } catch (error) {
    if (error?.response?.status === 404) {
      const records = await getRecords();
      return records.find((record) => String(record.id) === String(recordId)) || null;
    }
    throw toError(error, "Failed to load medical record.");
  }
}

export async function getFailedAlerts() {
  try {
    const response = await api.get("/data/records/alerts/failed");
    return response.data;
  } catch (error) {
    throw toError(error, "Failed to load failed alerts.");
  }
}

export async function updateFailedAlertAction(recordId, doctorId, action) {
  try {
    const response = await api.post(`/data/records/${recordId}/alert-action`, {
      doctor_user_id: doctorId,
      action,
    });
    return response.data;
  } catch (error) {
    throw toError(error, "Failed to update alert action.");
  }
}

export async function appendDoctorNote(recordId, doctorId, noteText) {
  try {
    const response = await api.post(`/data/records/${recordId}/notes`, {
      medical_record_id: recordId,
      doctor_user_id: doctorId,
      note_text: noteText,
    });
    return response.data;
  } catch (error) {
    throw toError(error, "Failed to add doctor note.");
  }
}

export async function getBillingForPatient(patientId) {
  try {
    const response = await api.get(`/data/billing/patient/${patientId}`);
    return response.data;
  } catch (error) {
    throw toError(error, "Failed to load patient billing.");
  }
}

export async function getAllBilling() {
  try {
    const response = await api.get("/data/billing");
    return response.data;
  } catch (error) {
    throw toError(error, "Failed to load billing.");
  }
}

export async function sendBillingAlert(consultationId, adminUserId) {
  try {
    const response = await api.post(`/data/billing/${consultationId}/alert`, {
      admin_user_id: adminUserId,
    });
    return response.data;
  } catch (error) {
    throw toError(error, "Failed to send billing alert.");
  }
}

export async function markBillingPaid(consultationId, patientUserId) {
  try {
    const response = await api.post(`/data/billing/${consultationId}/paid`, {
      patient_user_id: patientUserId,
    });
    return response.data;
  } catch (error) {
    if (error?.response?.status === 404) {
      try {
        const response = await api.post("/data/billing/paid", {
          consultation_id: consultationId,
          patient_user_id: patientUserId,
        });
        return response.data;
      } catch (fallbackError) {
        throw toError(fallbackError, "Failed to mark bill as paid.");
      }
    }
    throw toError(error, "Failed to mark bill as paid.");
  }
}

export async function changePassword(userId, newPassword) {
  try {
    const response = await api.post("/auth/change-password", {
      user_id: userId,
      new_password: newPassword,
    });
    return response.data;
  } catch (error) {
    throw toError(error, "Failed to change password.");
  }
}

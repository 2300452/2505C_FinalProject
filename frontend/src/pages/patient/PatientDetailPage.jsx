import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import PatientProgressChart from "../../components/dashboard/PatientProgressChart";

function PatientDetailPage() {
  const { uuid } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const [patientRes, assessmentRes] = await Promise.all([
          axios.get(`http://localhost:8000/patients/${uuid}`),
          axios.get(`http://localhost:8000/patients/${uuid}/assessments`),
        ]);

        setPatient(patientRes.data);
        setAssessments(Array.isArray(assessmentRes.data) ? assessmentRes.data : []);
      } catch (error) {
        console.error("Failed to fetch patient details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [uuid]);

  if (loading) {
    return <div className="p-6">Loading patient details...</div>;
  }

  if (!patient) {
    return <div className="p-6">Patient not found.</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <button
        onClick={() => navigate("/doctor/patients")}
        className="text-blue-500 underline mb-4"
      >
        Back to patients
      </button>

      <h1 className="text-2xl font-bold mb-4">Patient Details</h1>

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <p className="mb-2">
          <strong>Patient UUID:</strong> {patient.uuid}
        </p>
        <p className="mb-2">
          <strong>Name:</strong> {patient.name}
        </p>
        <p className="mb-2">
          <strong>NRIC / ID:</strong> {patient.nric}
        </p>
        <p className="mb-2">
          <strong>Date of Birth:</strong> {patient.dob}
        </p>
        <p className="mb-2">
          <strong>Gender:</strong> {patient.gender}
        </p>
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => navigate(`/doctor/patients/${uuid}/edit`)}
          className="bg-yellow-500 text-white px-4 py-2 rounded-lg"
        >
          Edit Patient
        </button>

        <button
          onClick={() => navigate(`/doctor/upload?patient=${uuid}`)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Upload Video
        </button>

        <button
          onClick={() => navigate("/doctor/patients")}
          className="bg-gray-200 px-4 py-2 rounded-lg"
        >
          Back
        </button>
      </div>

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Progress Overview</h2>
        <PatientProgressChart assessments={assessments} />
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Assessment History</h2>

        {assessments.length === 0 ? (
          <p>No assessments found.</p>
        ) : (
          <div className="grid gap-4">
            {assessments.map((a) => (
              <div key={a.uuid} className="border rounded-lg p-4">
                <p>
                  <strong>Assessment UUID:</strong> {a.uuid}
                </p>
                <p>
                  <strong>Test Type:</strong> {a.test_type}
                </p>
                <p>
                  <strong>Status:</strong> {a.status}
                </p>
                <p>
                  <strong>Created At:</strong>{" "}
                  {a.created_at ? new Date(a.created_at).toLocaleString() : "-"}
                </p>

                <button
                  onClick={() => navigate(`/doctor/assessment/${a.uuid}`)}
                  className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  View Assessment
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PatientDetailPage;
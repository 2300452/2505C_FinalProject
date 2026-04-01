import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function FlaggedPage() {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFlagged = async () => {
      try {
        const res = await axios.get("http://localhost:8000/assessments/flagged");
        setAssessments(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Failed to fetch flagged assessments:", error);
        setAssessments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFlagged();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <button
        onClick={() => navigate("/doctor/dashboard")}
        className="text-blue-500 underline text-sm mb-4"
      >
        Go dashboard
      </button>

      <h1 className="text-2xl font-bold mb-4">Flagged Assessments</h1>

      {loading ? (
        <p>Loading flagged assessments...</p>
      ) : assessments.length === 0 ? (
        <p>No flagged assessments found.</p>
      ) : (
        <div className="grid gap-4">
          {assessments.map((a) => (
            <div key={a.uuid} className="bg-white shadow rounded-xl p-4">
              <p>
                <strong>Assessment UUID:</strong> {a.uuid}
              </p>
              <p>
                <strong>Patient UUID:</strong> {a.patient_uuid}
              </p>
              <p>
                <strong>Test Type:</strong> {a.test_type}
              </p>
              <p>
                <strong>Status:</strong> {a.status}
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
  );
}

export default FlaggedPage;
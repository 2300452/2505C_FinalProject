import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import BenchmarkGauge from "../../components/dashboard/BenchmarkGauge";

function AssessmentPage() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/assessments/${uuid}`);
        setAssessment(res.data);
      } catch (error) {
        console.error("Failed to fetch assessment:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessment();
  }, [uuid]);

  if (loading) {
    return <div className="p-6">Loading assessment...</div>;
  }

  if (!assessment) {
    return <div className="p-6">Assessment not found.</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button
        onClick={() => navigate("/doctor/dashboard")}
        className="text-blue-500 underline text-sm mb-4"
      >
        Go dashboard
      </button>

      <h1 className="text-2xl font-bold mb-4">Assessment Details</h1>

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <p className="mb-2">
          <strong>Assessment UUID:</strong> {assessment.uuid}
        </p>
        <p className="mb-2">
          <strong>Patient UUID:</strong> {assessment.patient_uuid}
        </p>
        <p className="mb-2">
          <strong>Test Type:</strong> {assessment.test_type}
        </p>
        <p className="mb-2">
          <strong>Status:</strong> {assessment.status}
        </p>
        <p className="mb-2">
          <strong>Created At:</strong>{" "}
          {assessment.created_at
            ? new Date(assessment.created_at).toLocaleString()
            : "-"}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Benchmark Summary</h2>

        <BenchmarkGauge
          label="Stand Time"
          value={assessment.stand_time ?? 0}
          max={5}
          unit="s"
        />

        <BenchmarkGauge
          label="Walk Time"
          value={assessment.walk_time ?? 0}
          max={10}
          unit="s"
        />

        <BenchmarkGauge
          label="Sit Time"
          value={assessment.sit_time ?? 0}
          max={5}
          unit="s"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => navigate(`/doctor/assessment/${uuid}/report`)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          View Report
        </button>

        <button
          onClick={() => navigate("/doctor/upload")}
          className="bg-gray-200 px-4 py-2 rounded-lg"
        >
          Upload Another Video
        </button>
      </div>
    </div>
  );
}

export default AssessmentPage;
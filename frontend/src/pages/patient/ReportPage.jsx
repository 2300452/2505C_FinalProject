import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import BenchmarkGauge from "../../components/dashboard/BenchmarkGauge";

function ReportPage() {
  const { uuid } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/assessments/${uuid}/report`);
        setReport(res.data);
      } catch (error) {
        console.error("Failed to fetch report:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [uuid]);

  if (loading) {
    return <div className="p-6">Loading report...</div>;
  }

  if (!report) {
    return <div className="p-6">Report not found.</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button
        onClick={() => navigate("/doctor/dashboard")}
        className="text-blue-500 underline text-sm mb-4"
      >
        Go dashboard
      </button>

      <h1 className="text-2xl font-bold mb-4">Assessment Report</h1>

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <p className="mb-2">
          <strong>Assessment UUID:</strong> {report.uuid}
        </p>
        <p className="mb-2">
          <strong>Patient UUID:</strong> {report.patient_uuid}
        </p>
        <p className="mb-2">
          <strong>Result:</strong> {report.result || report.status || "-"}
        </p>
        <p className="mb-2">
          <strong>Remarks:</strong> {report.remarks || "No remarks available."}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Benchmark Breakdown</h2>

        <BenchmarkGauge
          label="Stand Time"
          value={report.stand_time ?? 0}
          max={5}
          unit="s"
        />

        <BenchmarkGauge
          label="Walk Time"
          value={report.walk_time ?? 0}
          max={10}
          unit="s"
        />

        <BenchmarkGauge
          label="Sit Time"
          value={report.sit_time ?? 0}
          max={5}
          unit="s"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => navigate(`/doctor/assessment/${uuid}`)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Back to Assessment
        </button>
      </div>
    </div>
  );
}

export default ReportPage;
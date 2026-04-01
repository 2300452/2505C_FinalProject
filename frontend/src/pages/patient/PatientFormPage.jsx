import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

function PatientFormPage() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(uuid);

  const [form, setForm] = useState({
    name: "",
    nric: "",
    dob: "",
    gender: "",
  });

  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      const fetchPatient = async () => {
        try {
          const res = await axios.get(`http://localhost:8000/patients/${uuid}`);
          setForm({
            name: res.data.name || "",
            nric: res.data.nric || "",
            dob: res.data.dob || "",
            gender: res.data.gender || "",
          });
        } catch (error) {
          console.error("Failed to fetch patient:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchPatient();
    }
  }, [isEdit, uuid]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isEdit) {
        await axios.put(`http://localhost:8000/patients/${uuid}`, form);
        navigate(`/doctor/patients/${uuid}`);
      } else {
        const res = await axios.post("http://localhost:8000/patients", form);
        navigate(`/doctor/patients/${res.data.uuid}`);
      }
    } catch (error) {
      console.error("Failed to save patient:", error);
    }
  };

  if (loading) {
    return <div className="p-6">Loading patient form...</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        {isEdit ? "Edit Patient" : "Create Patient"}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-xl p-6 space-y-4">
        <div>
          <label className="block mb-1 font-medium">Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">NRIC / ID</label>
          <input
            type="text"
            name="nric"
            value={form.nric}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Date of Birth</label>
          <input
            type="date"
            name="dob"
            value={form.dob}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Gender</label>
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            {isEdit ? "Update Patient" : "Create Patient"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/doctor/patients")}
            className="bg-gray-200 px-4 py-2 rounded-lg"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default PatientFormPage;
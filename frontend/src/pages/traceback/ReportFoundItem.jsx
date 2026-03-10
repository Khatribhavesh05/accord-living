import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, UploadCloud, CheckCircle2 } from "lucide-react";

const categories = [
  "Wallet",
  "Phone",
  "Bag",
  "Keys",
  "Jewelry",
  "Electronics",
  "Clothing",
  "Other",
];

export default function ReportFoundItem() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    category: "",
    date: "",
    description: "",
    location: "",
    image: null,
    name: "",
    contact: "",
    agree: false,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "checkbox") {
      setForm((f) => ({ ...f, [name]: checked }));
    } else if (type === "file") {
      const file = files[0];
      if (file && file.size > 5 * 1024 * 1024) {
        setError("Image must be less than 5MB");
        return;
      }
      setForm((f) => ({ ...f, image: file }));
      setImagePreview(file ? URL.createObjectURL(file) : null);
      setError("");
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setForm((f) => ({ ...f, location: `${latitude}, ${longitude}` }));
        setError("");
      },
      () => setError("Unable to fetch location")
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    // Simulate API call
    setTimeout(() => {
      setSubmitting(false);
      navigate("/traceback/claims");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200 p-8 mt-8">
        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Report Found Item</h1>
        <p className="text-slate-500 mb-6">Fill out the details below to help us match this found item to its owner.</p>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block font-semibold mb-1">Item Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              required
              className="w-full border border-slate-200 rounded-lg px-4 py-2 bg-slate-50 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
            >
              <option value="" disabled>Select category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">Date Found</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
              className="w-full border border-slate-200 rounded-lg px-4 py-2 bg-slate-50 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              rows={3}
              placeholder="Describe the found item in detail..."
              className="w-full border border-slate-200 rounded-lg px-4 py-2 bg-slate-50 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Location Found</label>
            <div className="flex gap-2">
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                required
                placeholder="Enter location or use current"
                className="flex-1 border border-slate-200 rounded-lg px-4 py-2 bg-slate-50 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
              />
              <button
                type="button"
                onClick={handleLocation}
                className="inline-flex items-center gap-1 px-3 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg font-medium hover:bg-indigo-100 transition-colors"
              >
                <MapPin size={16} /> Use My Current Location
              </button>
            </div>
          </div>
          <div>
            <label className="block font-semibold mb-1">Image Upload (Max 5MB)</label>
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg p-6 bg-slate-50">
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={handleChange}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center">
                <UploadCloud size={32} className="text-indigo-400 mb-2" />
                <span className="text-slate-500 font-medium">Drag & Drop or Click to Upload</span>
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" className="mt-3 max-h-32 rounded-lg border border-slate-200" />
                )}
              </label>
              {form.image && (
                <span className="mt-2 text-xs text-slate-400">{form.image.name}</span>
              )}
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block font-semibold mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full border border-slate-200 rounded-lg px-4 py-2 bg-slate-50 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
              />
            </div>
            <div className="flex-1">
              <label className="block font-semibold mb-1">Email or Phone</label>
              <input
                type="text"
                name="contact"
                value={form.contact}
                onChange={handleChange}
                required
                className="w-full border border-slate-200 rounded-lg px-4 py-2 bg-slate-50 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="agree"
              checked={form.agree}
              onChange={handleChange}
              required
              className="accent-indigo-600 w-5 h-5"
            />
            <label className="text-slate-600 text-sm select-none">
              I acknowledge the information is accurate and agree to the privacy policy.
            </label>
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 mt-2 bg-indigo-700 text-white text-lg font-bold rounded-xl shadow-lg hover:bg-indigo-800 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <CheckCircle2 className="animate-spin" /> Submitting...
              </>
            ) : (
              "Submit"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

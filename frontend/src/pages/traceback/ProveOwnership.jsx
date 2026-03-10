import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldQuestion, CheckCircle2 } from "lucide-react";

// Example dynamic questions for jewelry
const getQuestions = (desc = "") => {
  // In real app, use AI or NLP. Here, simple keyword logic:
  const d = desc.toLowerCase();
  if (d.includes("chain")) return [
    "Describe unique markings",
    "Chain type",
    "Scratches or wear details"
  ];
  if (d.includes("ring")) return [
    "Describe engravings or initials",
    "Ring size or fit",
    "Any gemstones or color details"
  ];
  return [
    "Describe unique features",
    "Material or color",
    "Any visible damage or marks"
  ];
};

export default function ProveOwnership() {
  const navigate = useNavigate();
  // In real app, get description from match context or params
  const description = "Gold chain with locket";
  const questions = getQuestions(description);
  const [answers, setAnswers] = useState(["", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (idx, val) => {
    setAnswers((a) => a.map((v, i) => (i === idx ? val : v)));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      // In real app, send to backend
    }, 1200);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-md w-full text-center mt-12">
          <CheckCircle2 className="text-green-500 mx-auto mb-4" size={48} />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Claim Awaiting Review</h2>
          <p className="text-slate-600 mb-6">Your answers have been submitted. The finder or security will review your claim and contact you if approved.</p>
          <button
            className="px-6 py-2 bg-indigo-700 text-white rounded-lg font-bold shadow hover:bg-indigo-800 transition-all"
            onClick={() => navigate("/dashboard")}
          >Go to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-md w-full mt-12">
        <h1 className="text-2xl font-extrabold text-slate-900 mb-2 flex items-center gap-2">
          <ShieldQuestion className="text-indigo-500" /> Prove Ownership
        </h1>
        <p className="text-slate-500 mb-6">Answer the following questions to help us verify you are the rightful owner.</p>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {questions.map((q, idx) => (
            <div key={idx}>
              <label className="block font-semibold mb-1">{q}</label>
              <textarea
                required
                rows={2}
                value={answers[idx]}
                onChange={e => handleChange(idx, e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-4 py-2 bg-slate-50 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                placeholder="Type your answer..."
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 mt-2 bg-indigo-700 text-white text-lg font-bold rounded-xl shadow-lg hover:bg-indigo-800 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <ShieldQuestion className="animate-spin" /> Submitting...
              </>
            ) : (
              "Submit Answers"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

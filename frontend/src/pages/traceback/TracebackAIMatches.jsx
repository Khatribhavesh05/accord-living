import React from "react";
import { useNavigate } from "react-router-dom";
import { Gem, MapPin, Calendar, Percent, Sparkles } from "lucide-react";

const mockMatches = [
  {
    id: 1,
    category: "Jewelry",
    matchPercent: 87,
    aiReason: "The description and location closely match a gold ring found in the lobby.",
    dateFound: "2026-02-12",
    location: "Lobby, Main Building",
  },
  // Add more mock matches if needed
];

export default function TracebackAIMatches() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 p-8 mt-8">
        <h1 className="text-2xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
          <Sparkles className="text-indigo-500" /> Potential Matches Found
        </h1>
        <div className="space-y-6">
          {mockMatches.map((match) => (
            <div key={match.id} className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm">
              <div className="flex-shrink-0 flex flex-col items-center gap-2">
                <div className="bg-white border border-indigo-200 rounded-full p-4 mb-2">
                  <Gem className="text-indigo-600" size={36} />
                </div>
                <span className="text-indigo-700 font-bold text-lg capitalize">{match.category}</span>
                <span className="flex items-center gap-1 text-indigo-600 font-semibold text-xl">
                  <Percent size={18} /> {match.matchPercent}% match
                </span>
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <div className="text-slate-700 font-medium mb-1">{match.aiReason}</div>
                <div className="flex items-center gap-4 text-slate-500 text-sm">
                  <span className="flex items-center gap-1"><Calendar size={16} /> {match.dateFound}</span>
                  <span className="flex items-center gap-1"><MapPin size={16} /> {match.location}</span>
                </div>
                <button
                  className="mt-4 px-6 py-2 bg-indigo-700 text-white rounded-lg font-bold shadow hover:bg-indigo-800 transition-all w-fit"
                  onClick={() => navigate("/traceback/claims")}
                >
                  Claim This Item
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

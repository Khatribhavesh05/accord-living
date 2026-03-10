import React, { useState, useRef, useEffect } from "react";
import QRCode from "qrcode.react";
import { CheckCircle2, XCircle, User, ShieldCheck } from "lucide-react";

// Mock claim data
const claim = {
  claimant: "Amit Sharma",
  answers: [
    "Gold chain with a small locket.",
    "Curb chain type, 22k gold.",
    "Slight scratch near the clasp."
  ],
  status: "pending_review"
};

export default function ClaimReview() {
  const [decision, setDecision] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleDecision = (result) => {
    setProcessing(true);
    setTimeout(() => {
      setDecision(result);
      setProcessing(false);
    }, 1200);
  };

  if (decision === "approved") {
    // QR code state
    const [qrData, setQrData] = useState(null);
    const [expiresAt, setExpiresAt] = useState(null);
    const [timer, setTimer] = useState(600); // 10 minutes in seconds
    const timerRef = useRef();

    // Generate a mock encrypted QR code (replace with real encryption in production)
    const generateQrCode = () => {
      const unique = `${claim.claimant}|${Date.now()}|${Math.random().toString(36).slice(2)}`;
      // In production, encrypt this string securely
      setQrData(btoa(unique));
      setExpiresAt(Date.now() + 10 * 60 * 1000); // 10 minutes from now
      setTimer(600);
    };

    // Countdown timer effect
    useEffect(() => {
      if (!expiresAt) return;
      timerRef.current = setInterval(() => {
        const secondsLeft = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
        setTimer(secondsLeft);
        if (secondsLeft <= 0) {
          clearInterval(timerRef.current);
        }
      }, 1000);
      return () => clearInterval(timerRef.current);
    }, [expiresAt]);

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-md w-full text-center mt-12">
          <ShieldCheck className="text-green-500 mx-auto mb-4" size={48} />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Generate Secure Pickup QR Code</h2>
          <p className="text-slate-600 mb-6">Generate a secure QR code for item pickup. The QR code will expire after 10 minutes for your safety.</p>
          {!qrData ? (
            <button
              className="px-6 py-3 bg-indigo-700 text-white rounded-lg font-bold shadow hover:bg-indigo-800 transition-all mb-4"
              onClick={generateQrCode}
            >
              Generate QR Code
            </button>
          ) : (
            <div className="flex flex-col items-center gap-4 my-6">
              <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4 flex flex-col items-center">
                <span className="text-slate-500 text-xs mb-2">Pickup QR Code (expires in <span className="font-bold text-indigo-700">{Math.floor(timer/60)}:{(timer%60).toString().padStart(2,'0')}</span>)</span>
                <div className="w-32 h-32 bg-white flex items-center justify-center rounded-lg shadow-inner border border-indigo-100">
                  <QRCode value={qrData} size={120} level="H" includeMargin={true} />
                </div>
              </div>
              <span className="text-slate-600 text-sm">Show this QR code to the finder at pickup.</span>
              {timer === 0 && <span className="text-red-500 text-xs font-semibold">QR code expired. Please generate a new one.</span>}
            </div>
          )}
        </div>
      </div>
    );
  }
  if (decision === "rejected") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-md w-full text-center mt-12">
          <XCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Claim Rejected</h2>
          <p className="text-slate-600 mb-6">The claimant will be notified. The item remains in your found inventory.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-md w-full mt-12">
        <h1 className="text-2xl font-extrabold text-slate-900 mb-2 flex items-center gap-2">
          <User className="text-indigo-500" /> Claim Review
        </h1>
        <p className="text-slate-500 mb-6">Review the claimant's answers and decide whether to approve or reject the claim.</p>
        <div className="mb-6">
          <div className="font-semibold text-slate-700 mb-2">Claimant: <span className="font-bold text-indigo-700">{claim.claimant}</span></div>
          <div className="space-y-3">
            {claim.answers.map((ans, idx) => (
              <div key={idx} className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-slate-700">
                <span className="font-semibold text-slate-500 mr-2">Q{idx + 1}:</span> {ans}
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-4 mt-6">
          <button
            className="flex-1 py-3 bg-red-100 text-red-700 font-bold rounded-lg shadow hover:bg-red-200 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            onClick={() => handleDecision("rejected")}
            disabled={processing}
          >
            <XCircle /> Reject
          </button>
          <button
            className="flex-1 py-3 bg-green-600 text-white font-bold rounded-lg shadow hover:bg-green-700 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            onClick={() => handleDecision("approved")}
            disabled={processing}
          >
            <CheckCircle2 /> Approve
          </button>
        </div>
      </div>
    </div>
  );
}

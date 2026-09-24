"use client";

import React, { useState } from "react";
import {
  Shield,
  Save,
  CheckCircle2,
  Sliders,
} from "lucide-react";
import { useDialog } from "@/components/ui/DialogProvider";

export default function DriverSettings() {
  const { alert } = useDialog();
  const [autoAccept, setAutoAccept] = useState(false);
  const [audioCues, setAudioCues] = useState(true);
  const [petFriendly, setPetFriendly] = useState(true);
  const [maxDistance, setMaxDistance] = useState("ANY");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    alert({
      title: "Captain Preferences Saved",
      message: "Your shift preferences and dispatch filters have been updated successfully.",
      confirmText: "Great",
      variant: "success",
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Captain Settings & Dispatch Filters
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure automated ride acceptance, navigation audio, and trip filters
          </p>
        </div>

        <button
          onClick={handleSave}
          className="py-2.5 px-5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
        >
          {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
          <span>{saved ? "Saved!" : "Save Changes"}</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm flex flex-col gap-6">
        {/* Dispatch Controls */}
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-teal-800 flex items-center gap-2 mb-4">
            <Sliders size={16} /> Dispatch Automation & Preferences
          </h3>

          <div className="divide-y divide-slate-100">
            {/* Auto Accept */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div>
                <h4 className="font-extrabold text-sm text-slate-800">Auto-Accept Rides</h4>
                <p className="text-xs text-slate-500">
                  Automatically accept all rides with &gt; 4.8★ rated riders within 2 km
                </p>
              </div>
              <button
                onClick={() => setAutoAccept(!autoAccept)}
                className={`w-12 h-7 rounded-full p-1 transition-colors ${
                  autoAccept ? "bg-teal-600" : "bg-slate-200"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    autoAccept ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Audio Alerts */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div>
                <h4 className="font-extrabold text-sm text-slate-800">Loud Dispatch Chime</h4>
                <p className="text-xs text-slate-500">
                  Play audible ringtone at max volume when new ride request arrives
                </p>
              </div>
              <button
                onClick={() => setAudioCues(!audioCues)}
                className={`w-12 h-7 rounded-full p-1 transition-colors ${
                  audioCues ? "bg-teal-600" : "bg-slate-200"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    audioCues ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Pet Friendly */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div>
                <h4 className="font-extrabold text-sm text-slate-800">Pet Friendly Commutes</h4>
                <p className="text-xs text-slate-500">
                  Receive Bhavo Pet rides (+20% higher payout incentive per trip)
                </p>
              </div>
              <button
                onClick={() => setPetFriendly(!petFriendly)}
                className={`w-12 h-7 rounded-full p-1 transition-colors ${
                  petFriendly ? "bg-teal-600" : "bg-slate-200"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    petFriendly ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Maximum Distance Filter */}
            <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-extrabold text-sm text-slate-800">Trip Distance Preference</h4>
                <p className="text-xs text-slate-500">
                  Filter requests based on estimated travel distance
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                {["SHORT (<5 km)", "MEDIUM (<15 km)", "ANY"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setMaxDistance(opt)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      maxDistance === opt
                        ? "bg-teal-700 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Safety & App Preferences */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-teal-800 flex items-center gap-2 mb-4">
            <Shield size={16} /> Safety & Contact Sharing
          </h3>

          <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200 flex items-center justify-between">
            <div>
              <h4 className="font-extrabold text-sm text-teal-950">Number Masking is Active</h4>
              <p className="text-xs text-teal-800 mt-0.5">
                Your personal phone number is never revealed to riders. Calls route through encrypted Bhavo VoIP.
              </p>
            </div>
            <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full shrink-0">
              Enabled
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

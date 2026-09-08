"use client";

import React, { useState, useEffect } from "react";
import {
  User, ShieldCheck, Dog, Camera, Edit2, PhoneCall,
  Plus, Trash2, Check, X
} from "lucide-react";

interface EmergencyContact {
  name: string;
  phone: string;
  relation?: string;
}

interface PetProfile {
  name: string;
  breed: string;
  weight: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string | null;
  role: string;
  rating: number;
  walletBalance: number;
  emergencyContacts: EmergencyContact[];
  pets: PetProfile[];
  totalRides: number;
  createdAt: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit Personal Info State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Emergency Contact Modal State
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactRelation, setContactRelation] = useState("Family");

  // Pet Profile Modal State
  const [isPetModalOpen, setIsPetModalOpen] = useState(false);
  const [petName, setPetName] = useState("");
  const [petBreed, setPetBreed] = useState("Golden Retriever");
  const [petWeight, setPetWeight] = useState("20kg");

  const [notification, setNotification] = useState("");


  useEffect(() => {
    let ignore = false;
    fetch("/api/user/profile")
      .then((res) => res.json())
      .then((json) => {
        if (!ignore && json.data) {
          setProfile(json.data);
          setEditName(json.data.name || "");
          setEditPhone(json.data.phone || "+91 98765 43210");
        }
        if (!ignore) setLoading(false);
      })
      .catch(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const showSuccessNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3000);
  };

  const handleUpdatePersonalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editPhone.trim()) return;

    try {
      setSavingProfile(true);
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          phone: editPhone.trim(),
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setProfile((prev) => (prev ? { ...prev, ...json.data } : null));
        setIsEditProfileOpen(false);
        showSuccessNotice("Personal information updated successfully.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim() || !profile) return;

    const newContacts = [
      ...profile.emergencyContacts,
      { name: contactName.trim(), phone: contactPhone.trim(), relation: contactRelation },
    ];

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emergencyContacts: newContacts }),
      });
      if (res.ok) {
        const json = await res.json();
        setProfile((prev) => (prev ? { ...prev, emergencyContacts: json.data.emergencyContacts } : null));
        setIsContactModalOpen(false);
        setContactName("");
        setContactPhone("");
        showSuccessNotice("Emergency contact added.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteContact = async (index: number) => {
    if (!profile) return;
    const newContacts = profile.emergencyContacts.filter((_, i) => i !== index);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emergencyContacts: newContacts }),
      });
      if (res.ok) {
        setProfile((prev) => (prev ? { ...prev, emergencyContacts: newContacts } : null));
        showSuccessNotice("Emergency contact removed.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddPet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!petName.trim() || !profile) return;

    const newPets = [
      ...profile.pets,
      { name: petName.trim(), breed: petBreed.trim(), weight: petWeight.trim() },
    ];

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pets: newPets }),
      });
      if (res.ok) {
        const json = await res.json();
        setProfile((prev) => (prev ? { ...prev, pets: json.data.pets } : null));
        setIsPetModalOpen(false);
        setPetName("");
        showSuccessNotice("Pet profile added.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePet = async (index: number) => {
    if (!profile) return;
    const newPets = profile.pets.filter((_, i) => i !== index);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pets: newPets }),
      });
      if (res.ok) {
        setProfile((prev) => (prev ? { ...prev, pets: newPets } : null));
        showSuccessNotice("Pet profile removed.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="card p-12 text-center text-slate-500 text-sm">
        Loading user profile from database...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="card p-12 text-center text-slate-500 text-sm">
        Unable to load profile. Please sign in again.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      {notification && (
        <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-[13px] font-semibold flex items-center gap-2 animate-in fade-in">
          <Check size={16} className="text-teal-600" />
          <span>{notification}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Overview */}
        <div className="lg:col-span-1 flex flex-col gap-5">
          <div className="card overflow-hidden flex flex-col items-center text-center">
            {/* Banner */}
            <div
              className="w-full h-24 relative"
              style={{ background: "linear-gradient(135deg, #0f766e 0%, #115e59 100%)" }}
            >
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                <div
                  className="w-20 h-20 rounded-full overflow-hidden relative"
                  style={{ border: "3px solid white", boxShadow: "0 4px 16px rgba(13,148,136,0.2)" }}
                >
                  <div className="w-full h-full bg-teal-100 flex items-center justify-center font-black text-2xl text-teal-800">
                    {profile.name[0]}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => alert("Photo upload coming soon.")}
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center text-white shadow-md bg-teal-700 border-2 border-white transition-transform hover:scale-110 cursor-pointer"
                >
                  <Camera size={12} />
                </button>
              </div>
            </div>

            <div className="pt-14 pb-6 px-6 w-full">
              <h2 className="text-[17px] font-bold text-slate-900">{profile.name}</h2>
              <p className="text-[13px] font-medium text-slate-500 mt-0.5">{profile.email}</p>

              <div className="inline-flex items-center gap-1.5 mt-3 text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                <ShieldCheck size={13} /> Verified Bhavo Rider
              </div>

              {/* Dynamic Stats from DB */}
              <div className="mt-5 grid grid-cols-2 gap-3 w-full">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="font-black text-slate-900 text-xl">{profile.totalRides}</p>
                  <p className="text-[10px] font-bold text-teal-700 uppercase tracking-widest mt-1">
                    Completed Rides
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="font-black text-slate-900 text-xl">★ {profile.rating || 5.0}</p>
                  <p className="text-[10px] font-bold text-teal-700 uppercase tracking-widest mt-1">
                    Rider Rating
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Details & Settings */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Personal Information */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] font-bold text-slate-900 flex items-center gap-2">
                <User size={16} className="text-teal-600" /> Personal Details
              </h3>
              <button
                onClick={() => setIsEditProfileOpen(true)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-teal-50 text-teal-700 hover:bg-teal-100 cursor-pointer"
                title="Edit Details"
              >
                <Edit2 size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Full Name
                </p>
                <p className="text-[14px] font-bold text-slate-900">{profile.name}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Email Address
                </p>
                <p className="text-[14px] font-bold text-slate-900">{profile.email}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Phone Number
                </p>
                <p className="text-[14px] font-bold text-slate-900">{profile.phone}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Wallet Balance
                </p>
                <p className="text-[14px] font-bold text-teal-700">₹{profile.walletBalance}</p>
              </div>
            </div>
          </div>

          {/* Emergency Contacts from DB */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold text-slate-900 flex items-center gap-2">
                <PhoneCall size={16} className="text-teal-600" /> Emergency SOS Contacts
              </h3>
              <button
                onClick={() => setIsContactModalOpen(true)}
                className="text-[12px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> Add Contact
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              {profile.emergencyContacts.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">
                  No emergency contacts configured yet. Add trusted contacts for rapid SOS escalation.
                </p>
              ) : (
                profile.emergencyContacts.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-teal-200 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] font-bold text-slate-900">{c.name}</p>
                        <span className="text-[10px] font-semibold px-2 py-0.2 rounded bg-teal-50 text-teal-800">
                          {c.relation || "Contact"}
                        </span>
                      </div>
                      <p className="text-[12px] font-medium text-slate-500 mt-0.5">{c.phone}</p>
                    </div>

                    <button
                      onClick={() => handleDeleteContact(i)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pet Profiles from DB */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold text-slate-900 flex items-center gap-2">
                <Dog size={16} className="text-orange-500" /> Pet Profiles
              </h3>
              <button
                onClick={() => setIsPetModalOpen(true)}
                className="text-[12px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 bg-orange-50 px-2.5 py-1 rounded-lg cursor-pointer"
              >
                <Plus size={14} /> Add Pet
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              {profile.pets.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">
                  No pets added. Adding pet details allows automated matching with pet-friendly Bhavo drivers.
                </p>
              ) : (
                profile.pets.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-orange-50/50 border border-orange-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl bg-white shadow-xs border border-orange-200">
                        🐶
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-slate-900">{p.name}</p>
                        <p className="text-[12px] font-medium text-slate-500">
                          {p.breed} • {p.weight}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeletePet(i)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal: Edit Personal Info ── */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-4 bg-teal-800 text-white flex items-center justify-between">
              <h3 className="font-bold text-[16px]">Edit Personal Information</h3>
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdatePersonalInfo} className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold uppercase text-slate-600">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-900 text-[13px] outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold uppercase text-slate-600">Phone Number</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  required
                  className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-900 text-[13px] outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 rounded-lg text-[13px] font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2 rounded-lg text-[13px] font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingProfile ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Add Emergency Contact ── */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-4 bg-teal-800 text-white flex items-center justify-between">
              <h3 className="font-bold text-[16px]">Add Emergency Contact</h3>
              <button
                onClick={() => setIsContactModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddContact} className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold uppercase text-slate-600">Contact Name</label>
                <input
                  type="text"
                  placeholder="e.g. Father, Sister, Best Friend"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  required
                  className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-900 text-[13px] outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold uppercase text-slate-600">Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  required
                  className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-900 text-[13px] outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold uppercase text-slate-600">Relation</label>
                <select
                  value={contactRelation}
                  onChange={(e) => setContactRelation(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-slate-900 text-[13px] outline-none focus:border-teal-500 bg-white"
                >
                  <option value="Family">Family</option>
                  <option value="Spouse">Spouse / Partner</option>
                  <option value="Friend">Friend</option>
                  <option value="Colleague">Colleague</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsContactModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-[13px] font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-[13px] font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md transition-all cursor-pointer"
                >
                  Add Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Add Pet Profile ── */}
      {isPetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-4 bg-orange-600 text-white flex items-center justify-between">
              <h3 className="font-bold text-[16px]">Add Pet Profile</h3>
              <button
                onClick={() => setIsPetModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddPet} className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold uppercase text-slate-600">Pet Name</label>
                <input
                  type="text"
                  placeholder="e.g. Max, Bella, Rocky"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  required
                  className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-900 text-[13px] outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-bold uppercase text-slate-600">Breed / Type</label>
                  <input
                    type="text"
                    placeholder="e.g. Golden Retriever"
                    value={petBreed}
                    onChange={(e) => setPetBreed(e.target.value)}
                    required
                    className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-900 text-[13px] outline-none focus:border-orange-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-bold uppercase text-slate-600">Approx. Weight</label>
                  <input
                    type="text"
                    placeholder="e.g. 15kg"
                    value={petWeight}
                    onChange={(e) => setPetWeight(e.target.value)}
                    required
                    className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-900 text-[13px] outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPetModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-[13px] font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-[13px] font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-md transition-all cursor-pointer"
                >
                  Save Pet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin, Home, Briefcase, Plus, Heart, Navigation, Edit2, Trash2,
  Check, X, AlertCircle, Dumbbell, Compass
} from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import LocationSearch from "../book-ride/LocationSearch";
import { useDialog } from "@/components/ui/DialogProvider";

const LeafletMap = dynamic(() => import("../book-ride/LeafletMap"), { ssr: false });

export interface PlaceItem {
  _id: string;
  name: string;
  address: string;
  coordinates: [number, number];
  tag: "Home" | "Work" | "Gym" | "Favourite" | "Other";
  isFavorite: boolean;
}

const getTagIcon = (tag: string) => {
  switch (tag) {
    case "Home":
      return Home;
    case "Work":
      return Briefcase;
    case "Gym":
      return Dumbbell;
    case "Favourite":
      return Heart;
    default:
      return Compass;
  }
};

export default function PlacesPage() {
  const router = useRouter();
  const { confirm } = useDialog();
  const [places, setPlaces] = useState<PlaceItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");

  // Add Place Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("Connaught Place, New Delhi");
  const [newCoords, setNewCoords] = useState<[number, number]>([28.6139, 77.2090]);
  const [newTag, setNewTag] = useState<"Home" | "Work" | "Gym" | "Favourite" | "Other">("Other");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  const fetchPlaces = () => {
    fetch("/api/user/places")
      .then((res) => res.json())
      .then((json) => {
        setPlaces(json.data || []);
        setLoading(false);
      })
      .catch((e) => {
        console.error("Failed to fetch places:", e);
        setLoading(false);
      });
  };

  useEffect(() => {
    let ignore = false;
    fetch("/api/user/places")
      .then((res) => res.json())
      .then((json) => {
        if (!ignore) {
          setPlaces(json.data || []);
          setLoading(false);
        }
      })
      .catch((e) => {
        console.error("Failed to fetch places:", e);
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const handleAddPlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newAddress.trim()) {
      setModalError("Please provide both name and address.");
      return;
    }

    try {
      setSubmitting(true);
      setModalError("");
      const res = await fetch("/api/user/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          address: newAddress.trim(),
          coordinates: newCoords,
          tag: newTag,
          isFavorite: newTag === "Favourite",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setModalError(data.message || "Failed to create place");
        setSubmitting(false);
        return;
      }

      setIsModalOpen(false);
      setNewName("");
      fetchPlaces();
    } catch {
      setModalError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const res = await fetch("/api/user/places", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name: editName,
          address: editAddress,
        }),
      });
      if (res.ok) {
        setPlaces((prev) =>
          prev.map((p) => (p._id === id ? { ...p, name: editName, address: editAddress } : p))
        );
        setEditingId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePlace = async (id: string) => {
    const confirmed = await confirm({
      title: "Remove saved place?",
      message: "This location will be removed from your saved places.",
      confirmText: "Remove",
      cancelText: "Keep",
      variant: "danger",
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/user/places?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPlaces((prev) => prev.filter((p) => p._id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const mapMarkers = places.map((p) => ({
    coordinates: p.coordinates || [28.6139, 77.2090],
    label: p.name,
    tag: p.tag,
  }));

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Saved Destinations</h2>
          <p className="text-[13px] text-slate-500 font-medium">
            Manage your daily spots for 1-click instant booking and commuter routing.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="h-10 px-5 rounded-xl flex items-center justify-center gap-2 text-[13px] font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 transition-all cursor-pointer shrink-0"
        >
          <Plus size={16} /> Add New Place
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Saved Places List */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {loading ? (
            <div className="card p-12 text-center text-slate-500 text-sm">
              Loading saved places from database...
            </div>
          ) : places.length === 0 ? (
            <div className="card p-10 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 mb-3">
                <MapPin size={26} />
              </div>
              <h3 className="font-bold text-slate-900">No Saved Destinations</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4 max-w-sm">
                Bookmark your home, workplace, or gym to book rides with a single tap.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-teal-600 text-white font-bold text-xs"
              >
                Add Place
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {places.map((place) => {
                const IconComponent = getTagIcon(place.tag);
                const isEditing = editingId === place._id;

                return (
                  <div
                    key={place._id}
                    className="card p-5 transition-all hover:border-teal-200 group flex flex-col justify-between"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-teal-50 border border-teal-100 text-teal-700">
                        <IconComponent size={20} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full text-[14px] font-bold text-slate-900 bg-teal-50 px-2 py-0.5 rounded outline-none border border-teal-300"
                              autoFocus
                            />
                          ) : (
                            <h3 className="font-bold text-[14px] text-slate-900 truncate">
                              {place.name}
                            </h3>
                          )}
                          <span className="pill-teal shrink-0">{place.tag}</span>
                        </div>

                        {isEditing ? (
                          <textarea
                            value={editAddress}
                            onChange={(e) => setEditAddress(e.target.value)}
                            className="w-full text-[12px] font-medium text-slate-700 bg-teal-50 px-2 py-1 rounded outline-none border border-teal-300 mt-1 resize-none h-14"
                          />
                        ) : (
                          <p className="text-[12px] font-medium text-slate-600 leading-relaxed line-clamp-2">
                            {place.address}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(place._id)}
                            className="flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-teal-600 text-white cursor-pointer"
                          >
                            <Check size={12} /> Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              router.push(
                                `/user/book-ride?dest=${encodeURIComponent(place.address)}&lat=${place.coordinates?.[0] || ""}&lng=${place.coordinates?.[1] || ""}`
                              );
                            }}
                            className="flex items-center gap-1.5 text-[12px] font-bold px-3.5 py-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors cursor-pointer"
                          >
                            <Navigation size={12} /> Book Ride
                          </button>

                          <button
                            onClick={() => {
                              setEditingId(place._id);
                              setEditName(place.name);
                              setEditAddress(place.address);
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors ml-auto cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 size={13} />
                          </button>

                          <button
                            onClick={() => handleDeletePlace(place._id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Add New Destination Card */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="rounded-2xl p-5 flex flex-col items-center justify-center gap-2.5 text-slate-500 hover:text-teal-700 transition-all min-h-35 border-2 border-dashed border-slate-200 bg-slate-50/50 hover:border-teal-400 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm border border-slate-200">
                  <Plus size={18} className="text-teal-600" />
                </div>
                <span className="font-bold text-[13px]">Add Destination</span>
              </button>
            </div>
          )}
        </div>

        {/* Real Leaflet Map Preview */}
        <div className="flex flex-col gap-4">
          <div className="card overflow-hidden h-90 relative border border-slate-200 shadow-sm flex flex-col">
            <div className="p-3 bg-white border-b border-slate-100 flex items-center justify-between z-10">
              <span className="text-[12px] font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin size={13} className="text-teal-600" /> Map Overview
              </span>
              <span className="text-[11px] font-semibold text-slate-500 font-mono">
                {places.length} pins
              </span>
            </div>

            <div className="flex-1 relative">
              <LeafletMap customMarkers={mapMarkers} />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-[12px]">
            <p className="font-bold mb-1">Quick Tip</p>
            <p className="text-teal-700">
              Saved destinations show up on your Book Ride screen for one-tap pickup and destination selection.
            </p>
          </div>
        </div>
      </div>

      {/* ── Modal: Add Place ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
            <div className="p-4 bg-teal-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-teal-300" />
                <h3 className="font-bold text-[16px]">Save New Place</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddPlace} className="p-5 flex flex-col gap-4">
              {modalError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[12px] flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold uppercase text-slate-600">Place Label</label>
                <input
                  type="text"
                  placeholder="e.g. My Apartment, HQ, Gold's Gym"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-900 text-[13px] outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold uppercase text-slate-600">Category Tag</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(["Home", "Work", "Gym", "Favourite"] as const).map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setNewTag(t)}
                      className={`py-1.5 rounded-lg text-[12px] font-bold border transition-all cursor-pointer ${
                        newTag === t
                          ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
                <LocationSearch
                  label="Search Address"
                  placeholder="Search landmark, sector, or city..."
                  defaultValue={newAddress}
                  iconBg="#0d9488"
                  icon={<MapPin size={13} className="text-white" />}
                  onSelect={(lat, lon, name) => {
                    setNewCoords([lat, lon]);
                    setNewAddress(name);
                  }}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-[13px] font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg text-[13px] font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Saving..." : "Save Destination"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

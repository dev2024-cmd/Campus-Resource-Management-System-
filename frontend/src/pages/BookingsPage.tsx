import React, { useState, useEffect } from "react";
import {
  CalendarDays,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  Building,
  User as UserIcon,
  Filter,
  Lightbulb,
  ArrowRight,
  MapPin,
  Users,
  Zap,
  ChevronRight,
} from "lucide-react";
import apiClient from "../services/api";
import { Booking, Resource } from "../types";
import Badge from "../components/common/Badge";
import ConfirmModal from "../components/common/ConfirmModal";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

const parseTimeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const clean = timeStr.trim().toUpperCase();
  if (clean.includes("-")) {
    const parts = clean.split("-");
    return parseTimeToMinutes(parts[0].trim());
  }
  const match = clean.match(/^(\d{1,2})(?:[:.](\d{1,2}))?(?::\d{2})?\s*(AM|PM)?$/);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    const modifier = match[3];
    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }
  return 0;
};

export const BookingsPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole("superadmin", "admin");

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [reviewingBooking, setReviewingBooking] = useState<Booking | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [deletingBooking, setDeletingBooking] = useState<Booking | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Conflict & alternatives state
  const [conflictMessage, setConflictMessage] = useState("");
  const [alternatives, setAlternatives] = useState<Resource[]>([]);
  const [isAlternativesOpen, setIsAlternativesOpen] = useState(false);
  const [isLoadingAlternatives, setIsLoadingAlternatives] = useState(false);

  // Live schedule for the selected facility & date
  const [venueBookingsOnDate, setVenueBookingsOnDate] = useState<Booking[]>([]);

  // Form
  const initialForm = {
    resource: "",
    purpose: "",
    date: new Date().toISOString().split("T")[0],
    startTime: "09:00 AM",
    endTime: "11:00 AM",
    attendeesCount: 20,
    priority: "Normal" as const,
    remarks: "",
  };
  const [formData, setFormData] = useState(initialForm);

  // Real-time schedule fetch when user changes venue or date in the Create modal
  useEffect(() => {
    if (!isCreateOpen || !formData.resource || !formData.date) return;
    let isCancelled = false;
    apiClient
      .get(`/bookings?resourceId=${formData.resource}&date=${formData.date.trim()}&limit=50`)
      .then((res) => {
        if (!isCancelled && res.data?.data) {
          setVenueBookingsOnDate(
            res.data.data.filter((b: Booking) => b.status === "Approved" || b.status === "Pending")
          );
        }
      })
      .catch(() => {});
    return () => {
      isCancelled = true;
    };
  }, [isCreateOpen, formData.resource, formData.date]);

  // Real-time slot conflict evaluation
  const reqStart = parseTimeToMinutes(formData.startTime);
  const reqEnd = parseTimeToMinutes(formData.endTime) || reqStart + 60;
  const liveConflict = venueBookingsOnDate.find((eb) => {
    const ebStart = parseTimeToMinutes(eb.startTime);
    const ebEnd = parseTimeToMinutes(eb.endTime) || ebStart + 60;
    return reqStart < ebEnd && reqEnd > ebStart;
  });

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStatus !== "All") params.append("status", selectedStatus);
      if (searchTerm) params.append("search", searchTerm);
      if (dateFilter) params.append("date", dateFilter);
      params.append("limit", "20");

      const res = await apiClient.get(`/bookings?${params.toString()}`);
      if (res.data?.data) {
        setBookings(res.data.data);
      }
    } catch (err) {
      console.error("Fetch bookings error:", err);
      toast.error("Failed to load booking reservations.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchResources = async () => {
    try {
      const res = await apiClient.get("/resources?limit=100");
      if (res.data?.data) {
        setResources(res.data.data);
        if (res.data.data.length > 0 && !formData.resource) {
          setFormData((prev) => ({ ...prev, resource: res.data.data[0]._id }));
        }
      }
    } catch (err) {
      console.error("Fetch resources error:", err);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [selectedStatus, searchTerm, dateFilter]);

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.resource) {
      toast.error("Please select a campus facility.");
      return;
    }

    if (!formData.purpose || formData.purpose.trim().length < 3) {
      toast.error("Event purpose must be at least 3 characters.");
      return;
    }

    setIsSubmitting(true);
    setConflictMessage("");
    try {
      await apiClient.post("/bookings", {
        ...formData,
        attendeesCount: Number(formData.attendeesCount) || 1,
      });
      toast.success("Booking request registered! It is now pending approval.");
      setIsCreateOpen(false);
      setFormData(initialForm);
      fetchBookings();
    } catch (error: any) {
      const status = error.response?.status;
      const errorList = error.response?.data?.errors;
      let msg = error.response?.data?.message || "Failed to create booking.";
      if (Array.isArray(errorList) && errorList.length > 0) {
        msg = errorList.map((err: any) => err.message).join(" • ");
      }

      if (status === 409) {
        // Conflict detected — fetch alternatives
        setConflictMessage(msg);
        setIsLoadingAlternatives(true);
        try {
          const altRes = await apiClient.get("/bookings/alternatives", {
            params: {
              resourceId: formData.resource,
              date: formData.date,
              startTime: formData.startTime,
              endTime: formData.endTime,
              attendeesCount: Number(formData.attendeesCount) || 1,
            },
          });
          setAlternatives(altRes.data?.data || []);
        } catch {
          setAlternatives([]);
        } finally {
          setIsLoadingAlternatives(false);
          setIsAlternativesOpen(true);
        }
      } else {
        toast.error(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePickAlternative = (alt: Resource) => {
    setFormData((prev) => ({ ...prev, resource: alt._id }));
    setIsAlternativesOpen(false);
    setConflictMessage("");
    toast.info(`Switched to "${alt.name}". Review the form and submit again.`, { autoClose: 4000 });
  };

  const handleUpdateStatus = async (status: "Approved" | "Rejected") => {
    if (!reviewingBooking) return;
    setIsSubmitting(true);
    try {
      await apiClient.patch(`/bookings/${reviewingBooking._id}/status`, {
        status,
        rejectionReason: status === "Rejected" ? rejectionReason : undefined,
      });
      toast.success(`Booking request marked as ${status}.`);
      setReviewingBooking(null);
      setRejectionReason("");
      fetchBookings();
    } catch (error: any) {
      const msg = error.response?.data?.message || `Failed to update status to ${status}.`;
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBooking = async () => {
    if (!deletingBooking) return;
    setIsSubmitting(true);
    try {
      await apiClient.delete(`/bookings/${deletingBooking._id}`);
      toast.success("Booking record deleted successfully.");
      setDeletingBooking(null);
      fetchBookings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete booking.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Resource Bookings & Allocations</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Reserve campus facilities, enforce schedule conflict checks, and manage authorization workflows.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchBookings}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            title="Refresh bookings"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin text-green-600" : ""} />
          </button>

          <button
            onClick={() => {
              if (resources.length > 0) {
                setFormData((prev) => ({ ...prev, resource: resources[0]._id }));
              }
              setIsCreateOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-100 hover:bg-violet-200 text-violet-800 rounded-lg text-sm font-bold shadow-sm transition-colors cursor-pointer border border-violet-200"
          >
            <Plus size={16} />
            <span>New Reservation Request</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by purpose, resource name, booking code, requester..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-3">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4 pl-6">Code</th>
                <th className="py-3.5 px-4">Event Purpose</th>
                <th className="py-3.5 px-4">Resource Venue</th>
                <th className="py-3.5 px-4">Reservation Window</th>
                <th className="py-3.5 px-4">Requester</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Querying MongoDB bookings...</span>
                    </div>
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <CalendarDays size={36} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No booking reservations found.</p>
                    <p className="text-xs text-slate-400 mt-1">Submit a reservation request to schedule a campus venue.</p>
                  </td>
                </tr>
              ) : (
                bookings.map((bk) => (
                  <tr key={bk._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 pl-6 font-mono font-bold text-xs text-green-800">
                      {bk.bookingCode}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-xs truncate">
                      {bk.purpose}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="font-medium">{bk.resourceName}</div>
                      <div className="text-[11px] text-slate-400">{bk.resourceCategory}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="font-medium text-slate-800">{bk.date}</div>
                      <div className="text-xs text-slate-500 font-mono">
                        {bk.startTime} - {bk.endTime}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="font-medium text-slate-800">{bk.userName}</div>
                      <div className="text-[11px] text-slate-400">{bk.userEmail}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={bk.status as any}>{bk.status}</Badge>
                    </td>
                    <td className="py-3.5 px-4 pr-6 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {isAdmin && bk.status === "Pending" && (
                          <button
                            onClick={() => {
                              setReviewingBooking(bk);
                              setRejectionReason("");
                            }}
                            className="px-2.5 py-1 bg-violet-100 hover:bg-violet-200 text-violet-800 text-xs font-semibold rounded shadow-xs cursor-pointer"
                          >
                            Review
                          </button>
                        )}

                        {isAdmin && (
                          <button
                            onClick={() => setDeletingBooking(bk)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ALTERNATIVES MODAL */}
      {isAlternativesOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-violet-900/20 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-amber-200 overflow-hidden my-4 sm:my-8 flex flex-col max-h-[88vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Header (Sticky / Shrink-0) */}
            <div className="px-6 py-4 bg-amber-50 border-b border-amber-100 shrink-0">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/40 border border-amber-200 rounded-xl">
                    <AlertTriangle size={20} className="text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-amber-900">Booking Conflict Detected</h3>
                    <p className="text-xs text-amber-600 mt-0.5">This resource is already booked for the selected time slot</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAlternativesOpen(false)}
                  className="text-amber-600 hover:text-amber-800 transition-colors mt-0.5 cursor-pointer p-1 rounded-lg hover:bg-amber-100/50"
                  title="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {/* Conflict details */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                <div className="flex gap-2">
                  <AlertTriangle size={15} className="text-amber-600 mt-0.5 shrink-0" />
                  <span>{conflictMessage}</span>
                </div>
              </div>

              {/* Alternatives section */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-violet-100 text-violet-700 rounded-lg">
                      <Lightbulb size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Available Alternative Venues Across Campus</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Verified available on <span className="font-semibold text-slate-700">{formData.date}</span> ({formData.startTime} - {formData.endTime}) with zero conflicts
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-violet-100 text-violet-800 border border-violet-200 shrink-0">
                    {alternatives.length} Available
                  </span>
                </div>

                {isLoadingAlternatives ? (
                  <div className="py-10 text-center">
                    <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-slate-500">Checking venue availability across campus for this time slot...</p>
                  </div>
                ) : alternatives.length === 0 ? (
                  <div className="py-10 text-center">
                    <CalendarDays size={36} className="mx-auto text-slate-300 mb-3" />
                    <p className="font-semibold text-slate-700">No alternative venues free for this exact slot</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      All campus venues are currently booked or undergoing maintenance on {formData.date} between {formData.startTime} and {formData.endTime}. Try adjusting your requested time or selecting another date.
                    </p>
                    <button
                      onClick={() => setIsAlternativesOpen(false)}
                      className="mt-4 px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      Back to Reservation Form
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alternatives.map((alt) => {
                      const isCapacityOk = alt.capacity >= (formData.attendeesCount || 1);
                      return (
                        <button
                          key={alt._id}
                          onClick={() => handlePickAlternative(alt)}
                          className="w-full text-left group relative bg-white border border-slate-200 hover:border-violet-400 hover:bg-violet-50/30 hover:shadow-md rounded-xl p-4 transition-all cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-900 group-hover:text-violet-800 transition-colors">
                                  {alt.name}
                                </span>
                                <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                  {alt.resourceCode}
                                </span>
                                {alt.isSameCategory ? (
                                  <span className="text-[11px] bg-violet-100 text-violet-800 font-semibold px-2 py-0.5 rounded-full border border-violet-200">
                                    ★ Same Category
                                  </span>
                                ) : (
                                  <span className="text-[11px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-full border border-slate-200">
                                    {alt.category}
                                  </span>
                                )}
                                {isCapacityOk ? (
                                  <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                                    ✓ Fits {formData.attendeesCount} attendees (Cap: {alt.capacity})
                                  </span>
                                ) : (
                                  <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full border border-amber-200">
                                    ⚠ Max Capacity: {alt.capacity}
                                  </span>
                                )}
                              </div>
                              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                {(alt.location || alt.building) && (
                                  <span className="flex items-center gap-1">
                                    <MapPin size={12} className="text-slate-400" />
                                    {alt.location || alt.building}
                                    {alt.room ? ` · ${alt.room}` : ""}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Users size={12} className="text-slate-400" />
                                  Capacity: {alt.capacity} seats
                                </span>
                                <span className="font-medium text-emerald-700 flex items-center gap-1">
                                  <Check size={12} />
                                  Available for this slot
                                </span>
                              </div>
                              {alt.features && alt.features.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {alt.features.slice(0, 4).map((f, i) => (
                                    <span
                                      key={i}
                                      className="text-[10px] bg-slate-50 text-slate-600 border border-slate-200 rounded px-1.5 py-0.5"
                                    >
                                      {f}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-violet-200 group-hover:text-violet-800 text-slate-400 transition-all">
                              <ChevronRight size={16} />
                            </div>
                          </div>
                          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-violet-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-b-xl" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer (Sticky / Shrink-0) */}
            {alternatives.length > 0 && (
              <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  Prefer your original venue? You can keep it and adjust the date or time slot instead.
                </p>
                <button
                  onClick={() => setIsAlternativesOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                >
                  Keep Venue &amp; Change Time
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE BOOKING MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-violet-900/20 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 sm:my-6 flex flex-col max-h-[88vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Header (Sticky / Shrink-0) */}
            <div className="px-6 py-4 bg-violet-50 border-b border-violet-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-base text-slate-900">Request Campus Resource / Venue</h3>
                <p className="text-xs text-violet-600">Live conflict detection and allocation validation enabled</p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-violet-100/50 cursor-pointer"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Scrollable Form Body */}
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Facility *</label>
                <select
                  required
                  value={formData.resource}
                  onChange={(e) => setFormData({ ...formData, resource: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                >
                  {resources.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name} ({r.category}) — Cap: {r.capacity} &bull; Status: {r.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Event / Purpose of Booking *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Faculty Senate Meeting, CS301 Practical Examination"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Start Time *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 09:00 AM"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">End Time *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 11:30 AM"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Real-time Schedule & Conflict Verification Banner */}
              <div className="space-y-2">
                {venueBookingsOnDate.length > 0 ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1.5">
                    <div className="font-semibold text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Clock size={13} className="text-violet-600" />
                        Existing Bookings on {formData.date}:
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {venueBookingsOnDate.length} slot{venueBookingsOnDate.length > 1 ? "s" : ""} taken
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {venueBookingsOnDate.map((b) => (
                        <span
                          key={b._id}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono border flex items-center gap-1.5 ${
                            b.status === "Approved"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          <span className="font-semibold">{b.startTime} - {b.endTime}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/70 border border-current font-sans font-medium">
                            {b.status}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 px-1 py-0.5">
                    <Check size={13} className="text-emerald-500 shrink-0" />
                    <span>No prior reservations on {formData.date}. All time slots currently available for this facility.</span>
                  </div>
                )}

                {liveConflict ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2.5 animate-in fade-in duration-150">
                    <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-bold flex items-center justify-between">
                        <span>Live Booking Conflict Detected</span>
                        <span className="font-mono text-[11px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                          {liveConflict.bookingCode}
                        </span>
                      </div>
                      <p className="text-amber-800 mt-1 leading-relaxed">
                        Your requested slot (<strong>{formData.startTime} - {formData.endTime}</strong>) overlaps with an existing {liveConflict.status.toLowerCase()} booking (<strong>{liveConflict.startTime} - {liveConflict.endTime}</strong>). Submitting will open the Alternative Venue Finder.
                      </p>
                    </div>
                  </div>
                ) : (
                  formData.startTime &&
                  formData.endTime &&
                  venueBookingsOnDate.length > 0 && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in duration-150">
                      <Check size={14} className="text-emerald-600 shrink-0" />
                      <span>This exact time slot is free with zero conflicts on {formData.date}.</span>
                    </div>
                  )
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Expected Attendees</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.attendeesCount}
                    onChange={(e) => setFormData({ ...formData, attendeesCount: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Special Requirements / AV Gear</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Microphones, laser pointer, room AC pre-cooling"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                ></textarea>
              </div>
            </div>

            {/* Modal Footer (Sticky / Shrink-0) */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-violet-200 hover:bg-violet-300 text-violet-900 rounded-lg text-sm font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Validating Conflicts..." : "Submit Reservation"}
              </button>
            </div>
          </form>
        </div>
      </div>
      )}

      {/* REVIEW & APPROVAL MODAL */}
      {reviewingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-violet-900/20 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-4 max-h-[88vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-violet-50 border-b border-violet-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-base text-slate-900">Review Reservation Request</h3>
                <p className="text-xs text-violet-600">{reviewingBooking.bookingCode}</p>
              </div>
              <button onClick={() => setReviewingBooking(null)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-violet-100/50 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm overflow-y-auto flex-1">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold block">Event Purpose</span>
                  <span className="font-bold text-slate-900 text-base">{reviewingBooking.purpose}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-slate-400 block font-semibold">Venue:</span>
                    <span className="font-semibold text-slate-800">{reviewingBooking.resourceName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Requester:</span>
                    <span className="font-semibold text-slate-800">{reviewingBooking.userName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Date & Time:</span>
                    <span className="font-semibold text-slate-800">
                      {reviewingBooking.date} ({reviewingBooking.startTime} - {reviewingBooking.endTime})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Expected Attendees:</span>
                    <span className="font-semibold text-slate-800">{reviewingBooking.attendeesCount} Persons</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Rejection Reason (Required only if rejecting)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Conflicting academic timetable, maintenance scheduled"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleUpdateStatus("Rejected")}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <XCircle size={16} />
                  <span>Reject Request</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewingBooking(null)}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleUpdateStatus("Approved")}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={16} />
                    <span>Approve Allocation</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE */}
      <ConfirmModal
        isOpen={!!deletingBooking}
        title="Delete Booking Record"
        message={`Are you sure you want to delete reservation record '${deletingBooking?.bookingCode}'?`}
        confirmText="Yes, Delete Booking"
        isLoading={isSubmitting}
        onConfirm={handleDeleteBooking}
        onCancel={() => setDeletingBooking(null)}
      />
    </div>
  );
};

export default BookingsPage;




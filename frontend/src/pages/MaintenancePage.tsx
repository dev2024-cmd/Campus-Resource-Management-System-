import React, { useState, useEffect } from "react";
import {
  Wrench,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  Building,
} from "lucide-react";
import apiClient from "../services/api";
import { MaintenanceTicket, Resource } from "../types";
import Badge from "../components/common/Badge";
import ConfirmModal from "../components/common/ConfirmModal";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

export const MaintenancePage: React.FC = () => {
  const { hasRole } = useAuth();
  const canManage = hasRole("superadmin", "admin");

  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<MaintenanceTicket | null>(null);
  const [deletingTicket, setDeletingTicket] = useState<MaintenanceTicket | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const initialForm = {
    resource: "",
    issueTitle: "",
    description: "",
    priority: "Medium" as const,
    assignedTo: "Campus Engineering Support",
    scheduledDate: "",
    estimatedCost: 100,
  };
  const [formData, setFormData] = useState(initialForm);

  // Edit ticket status & cost
  const [editStatusForm, setEditStatusForm] = useState({
    status: "Reported" as const,
    assignedTo: "",
    actualCost: 0,
    resolutionNotes: "",
  });

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStatus !== "All") params.append("status", selectedStatus);
      if (selectedPriority !== "All") params.append("priority", selectedPriority);
      if (searchTerm) params.append("search", searchTerm);
      params.append("limit", "20");

      const res = await apiClient.get(`/maintenance?${params.toString()}`);
      if (res.data?.data) {
        setTickets(res.data.data);
      }
    } catch (err) {
      console.error("Fetch maintenance error:", err);
      toast.error("Failed to load maintenance tickets.");
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
    fetchTickets();
  }, [selectedStatus, selectedPriority, searchTerm]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post("/maintenance", formData);
      toast.success("Maintenance ticket logged! Resource flagged as Maintenance.");
      setIsCreateOpen(false);
      setFormData(initialForm);
      fetchTickets();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (t: MaintenanceTicket) => {
    setEditingTicket(t);
    setEditStatusForm({
      status: t.status as any,
      assignedTo: t.assignedTo || "Unassigned",
      actualCost: t.actualCost || 0,
      resolutionNotes: t.resolutionNotes || "",
    });
  };

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTicket) return;
    setIsSubmitting(true);
    try {
      await apiClient.put(`/maintenance/${editingTicket._id}`, editStatusForm);
      toast.success(`Ticket ${editingTicket.ticketCode} updated.`);
      setEditingTicket(null);
      fetchTickets();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!deletingTicket) return;
    setIsSubmitting(true);
    try {
      await apiClient.delete(`/maintenance/${deletingTicket._id}`);
      toast.success(`Maintenance ticket ${deletingTicket.ticketCode} deleted.`);
      setDeletingTicket(null);
      fetchTickets();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Facility & Asset Maintenance</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Log equipment faults, dispatch campus technicians, and automatically synchronize resource availability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTickets}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            title="Refresh"
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
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-mint-100 hover:bg-violet-100 text-violet-800 rounded-lg text-sm font-bold shadow-sm transition-colors cursor-pointer border border-violet-200"
          >
            <Plus size={16} />
            <span>Report Fault / Request Service</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search tickets by issue title, resource, technician, code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-3">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="All">All Statuses</option>
            <option value="Reported">Reported</option>
            <option value="Scheduled">Scheduled</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="All">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4 pl-6">Ticket Code</th>
                <th className="py-3.5 px-4">Issue Title</th>
                <th className="py-3.5 px-4">Target Resource</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Assigned To</th>
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
                      <span>Loading maintenance orders...</span>
                    </div>
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <Wrench size={36} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No maintenance tickets found.</p>
                    <p className="text-xs text-slate-400 mt-1">Report any damaged equipment or facility repairs required.</p>
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 pl-6 font-mono font-bold text-xs text-green-800">
                      {t.ticketCode}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-xs">
                      <div>{t.issueTitle}</div>
                      <div className="text-[11px] text-slate-400 font-normal line-clamp-1">{t.description}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="font-medium">{t.resourceName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{t.resourceCode}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={t.priority.toLowerCase() as any}>{t.priority}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {t.assignedTo || "Unassigned"}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={t.status.toLowerCase() as any}>{t.status}</Badge>
                    </td>
                    <td className="py-3.5 px-4 pr-6 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {canManage && (
                          <button
                            onClick={() => handleOpenEdit(t)}
                            className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded cursor-pointer"
                            title="Update Status / Dispatch"
                          >
                            <Pencil size={16} />
                          </button>
                        )}
                        {canManage && (
                          <button
                            onClick={() => setDeletingTicket(t)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer"
                            title="Delete Ticket"
                          >
                            <Trash2 size={16} />
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

      {/* CREATE TICKET MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-violet-900/20 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Report Fault / Request Maintenance</h3>
                <p className="text-xs text-emerald-600">Creates service dispatch ticket and updates venue state</p>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Facility / Resource *</label>
                <select
                  required
                  value={formData.resource}
                  onChange={(e) => setFormData({ ...formData, resource: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                >
                  {resources.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name} ({r.resourceCode}) &bull; Building: {r.building || "Campus"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Issue Headline *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AC compressor failure, Projector bulb burnout"
                  value={formData.issueTitle}
                  onChange={(e) => setFormData({ ...formData, issueTitle: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Estimated Cost ($)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.estimatedCost}
                    onChange={(e) => setFormData({ ...formData, estimatedCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assigned Technician / Vendor</label>
                <input
                  type="text"
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Fault Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detailed observations regarding symptoms, affected parts, and safety hazards..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-violet-200 hover:bg-violet-300 text-violet-900 rounded-lg text-sm font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Registering Ticket..." : "Submit Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TICKET MODAL */}
      {editingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-violet-900/20 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Update Ticket: {editingTicket.ticketCode}</h3>
                <p className="text-xs text-emerald-600">{editingTicket.issueTitle}</p>
              </div>
              <button onClick={() => setEditingTicket(null)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateTicket} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ticket Progress Status</label>
                <select
                  value={editStatusForm.status}
                  onChange={(e) => setEditStatusForm({ ...editStatusForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                >
                  <option value="Reported">Reported</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed (Reverts Resource to Available)</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assigned Technician</label>
                <input
                  type="text"
                  value={editStatusForm.assignedTo}
                  onChange={(e) => setEditStatusForm({ ...editStatusForm, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Actual Incurred Cost ($)</label>
                <input
                  type="number"
                  min={0}
                  value={editStatusForm.actualCost}
                  onChange={(e) => setEditStatusForm({ ...editStatusForm, actualCost: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Resolution Notes</label>
                <textarea
                  rows={2}
                  placeholder="Parts replaced, calibration tests performed..."
                  value={editStatusForm.resolutionNotes}
                  onChange={(e) => setEditStatusForm({ ...editStatusForm, resolutionNotes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingTicket(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-violet-200 hover:bg-violet-300 text-violet-900 rounded-lg text-sm font-bold disabled:opacity-50"
                >
                  {isSubmitting ? "Updating..." : "Save Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE */}
      <ConfirmModal
        isOpen={!!deletingTicket}
        title="Delete Maintenance Ticket"
        message={`Are you sure you want to delete maintenance record '${deletingTicket?.ticketCode}'?`}
        confirmText="Yes, Delete Ticket"
        isLoading={isSubmitting}
        onConfirm={handleDeleteTicket}
        onCancel={() => setDeletingTicket(null)}
      />
    </div>
  );
};

export default MaintenancePage;




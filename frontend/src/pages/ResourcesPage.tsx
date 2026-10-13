import React, { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Search,
  Filter,
  Eye,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Layers,
  MapPin,
  Users as UsersIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import apiClient from "../services/api";
import { Resource, Category, LocationItem } from "../types";
import Badge from "../components/common/Badge";
import ConfirmModal from "../components/common/ConfirmModal";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

export const ResourcesPage: React.FC = () => {
  const { hasRole } = useAuth();
  const canManage = hasRole("superadmin", "admin");

  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [viewingResource, setViewingResource] = useState<Resource | null>(null);
  const [deletingResource, setDeletingResource] = useState<Resource | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const initialForm = {
    resourceCode: "",
    name: "",
    category: "",
    building: "",
    room: "",
    capacity: 30,
    status: "Available" as const,
    condition: "Excellent" as const,
    description: "",
    features: "",
    serialNumber: "",
  };

  const [formData, setFormData] = useState(initialForm);

  const fetchResources = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (selectedCategory !== "All") params.append("category", selectedCategory);
      if (selectedStatus !== "All") params.append("status", selectedStatus);
      params.append("page", String(currentPage));
      params.append("limit", "8");

      const response = await apiClient.get(`/resources?${params.toString()}`);
      if (response.data) {
        setResources(response.data.data || []);
        setTotalPages(response.data.totalPages || 1);
        setTotalRecords(response.data.total || 0);
      }
    } catch (error) {
      console.error("Error fetching resources:", error);
      toast.error("Failed to load resources from backend.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [catRes, locRes] = await Promise.all([
        apiClient.get("/categories"),
        apiClient.get("/locations"),
      ]);
      if (catRes.data?.data) setCategories(catRes.data.data);
      if (locRes.data?.data) setLocations(locRes.data.data);
    } catch (err) {
      console.error("Error fetching categories or locations:", err);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchResources();
  }, [searchTerm, selectedCategory, selectedStatus, currentPage]);

  const handleOpenCreate = () => {
    setFormData({
      ...initialForm,
      category: categories[0]?.name || "Seminar Hall",
      building: locations[0]?.building || "Academic Block A",
      room: locations[0]?.roomNumber || "A-101",
    });
    setEditingResource(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (res: Resource) => {
    setEditingResource(res);
    setFormData({
      resourceCode: res.resourceCode,
      name: res.name,
      category: res.category,
      building: res.building || "",
      room: res.room || "",
      capacity: res.capacity || 0,
      status: res.status,
      condition: res.condition,
      description: res.description || "",
      features: (res.features || []).join(", "),
      serialNumber: res.serialNumber || "",
    });
    setIsCreateOpen(true);
  };

  const handleSaveResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        features: formData.features
          ? formData.features.split(",").map((f) => f.trim()).filter(Boolean)
          : [],
      };

      if (editingResource) {
        await apiClient.put(`/resources/${editingResource._id}`, payload);
        toast.success(`Resource '${formData.name}' updated successfully!`);
      } else {
        await apiClient.post("/resources", payload);
        toast.success(`New resource '${formData.name}' created successfully!`);
      }

      setIsCreateOpen(false);
      setEditingResource(null);
      fetchResources();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to save resource.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingResource) return;
    setIsSubmitting(true);
    try {
      await apiClient.delete(`/resources/${deletingResource._id}`);
      toast.success(`Resource '${deletingResource.name}' deleted successfully.`);
      setDeletingResource(null);
      fetchResources();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Cannot delete this resource.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Campus Resource Catalog</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage all educational facilities, auditoriums, lecture halls, and specialized laboratory equipment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchResources}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin text-green-600" : ""} />
          </button>

          {canManage && (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-100 hover:bg-violet-200 text-violet-800 rounded-lg text-sm font-bold shadow-sm transition-colors cursor-pointer border border-violet-200"
            >
              <Plus size={16} />
              <span>Create New Resource</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by resource code, name, building, description..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-3">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Allocated">Allocated</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Reserved">Reserved</option>
          </select>
        </div>
      </div>

      {/* Resource Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4 pl-6">Code</th>
                <th className="py-3.5 px-4">Resource Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Location & Room</th>
                <th className="py-3.5 px-4 text-center">Capacity</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Condition</th>
                <th className="py-3.5 px-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading MongoDB resource records...</span>
                    </div>
                  </td>
                </tr>
              ) : resources.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <Building2 size={36} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No resources found matching the criteria.</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting the filters or create a new resource.</p>
                  </td>
                </tr>
              ) : (
                resources.map((res) => (
                  <tr key={res._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 pl-6 font-mono font-bold text-xs text-green-800">
                      {res.resourceCode}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {res.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        {res.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="text-xs">
                        <span className="font-medium text-slate-800">{res.building || "Campus Ground"}</span>
                        {res.room && <span className="text-slate-400"> &bull; Room {res.room}</span>}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                      {res.capacity > 0 ? res.capacity : "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={res.status as any}>{res.status}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span
                        className={`font-medium ${
                          res.condition === "Needs Attention"
                            ? "text-amber-600 font-bold"
                            : "text-slate-600"
                        }`}
                      >
                        {res.condition}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 pr-6 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setViewingResource(res)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        {canManage && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(res)}
                              className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Resource"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => setDeletingResource(res)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Resource"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-700">{resources.length}</span> of{" "}
            <span className="font-semibold text-slate-700">{totalRecords}</span> resources
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-slate-300 rounded bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-2 font-semibold text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-slate-300 rounded bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-violet-900/20 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-violet-50 border-b border-violet-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  {editingResource ? `Edit Resource: ${editingResource.name}` : "Create New Campus Resource"}
                </h3>
                <p className="text-xs text-violet-500">
                  Fill in resource specifications and persist directly in MongoDB
                </p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveResource} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Resource Code (Unique)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AUD-1001 (auto if empty)"
                    value={formData.resourceCode}
                    onChange={(e) => setFormData({ ...formData, resourceCode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm uppercase focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Leave blank to auto-generate sequentially.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Resource Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Main Auditorium A"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Resource Category *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Capacity (Persons / Units)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Building / Campus Facility
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Academic Block A"
                    value={formData.building}
                    onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Room / Door Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Room 204"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                  >
                    <option value="Available">Available</option>
                    <option value="Allocated">Allocated</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Reserved">Reserved</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Condition
                  </label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Needs Attention">Needs Attention</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Features / Equipment List (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dual 4K Projectors, Dolby Sound, Wireless Mic, Central AC"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description / Specification Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide technical or administrative notes regarding this campus asset..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
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
                  {isSubmitting ? "Persisting to Database..." : editingResource ? "Save Updates" : "Create Resource"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL VIEW MODAL */}
      {viewingResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-violet-900/20 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 text-green-800 flex items-center justify-center font-bold">
                  <Building2 size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 leading-tight">{viewingResource.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs font-semibold text-green-800 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                      {viewingResource.resourceCode}
                    </span>
                    <Badge variant={viewingResource.status as any}>{viewingResource.status}</Badge>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewingResource(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-xs text-slate-400 block font-semibold uppercase">Category</span>
                  <span className="font-semibold text-slate-800">{viewingResource.category}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-semibold uppercase">Capacity</span>
                  <span className="font-semibold text-slate-800">{viewingResource.capacity} Persons</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-semibold uppercase">Building</span>
                  <span className="font-semibold text-slate-800">{viewingResource.building || "Campus Center"}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-semibold uppercase">Room Number</span>
                  <span className="font-semibold text-slate-800">{viewingResource.room || "N/A"}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-semibold uppercase">Hardware Condition</span>
                  <span className="font-semibold text-slate-800">{viewingResource.condition}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-semibold uppercase">Serial / Asset Tag</span>
                  <span className="font-mono text-slate-700">{viewingResource.serialNumber || "None"}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-1">Description</h4>
                <p className="text-slate-600 bg-white p-3 border border-slate-100 rounded-lg">
                  {viewingResource.description || "No specific description entered for this asset."}
                </p>
              </div>

              {viewingResource.features && viewingResource.features.length > 0 && (
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">Equipped Features</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {viewingResource.features.map((f, i) => (
                      <span key={i} className="px-2.5 py-1 bg-green-50 text-green-800 text-xs rounded-full border border-green-100 font-medium">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewingResource(null)}
                className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={!!deletingResource}
        title="Confirm Resource Deletion"
        message={`Are you sure you want to permanently delete '${deletingResource?.name}' (${deletingResource?.resourceCode})? This action cannot be undone, and will be checked against active bookings and open maintenance tickets.`}
        confirmText="Yes, Delete Resource"
        isLoading={isSubmitting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingResource(null)}
      />
    </div>
  );
};

export default ResourcesPage;




import React, { useState, useEffect } from "react";
import {
  Layers,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  X,
  Building,
  RefreshCw,
  FolderOpen,
} from "lucide-react";
import apiClient from "../services/api";
import { Category, LocationItem } from "../types";
import ConfirmModal from "../components/common/ConfirmModal";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

export const CategoriesLocationsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const canManage = hasRole("superadmin", "admin");

  const [activeTab, setActiveTab] = useState<"categories" | "locations">("categories");
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals for Categories
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", code: "", description: "", color: "#0284c7" });

  // Modals for Locations
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationItem | null>(null);
  const [deletingLocation, setDeletingLocation] = useState<LocationItem | null>(null);
  const [locationForm, setLocationForm] = useState({
    name: "",
    building: "",
    floor: "Ground",
    roomNumber: "",
    capacity: 40,
    type: "Academic",
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [catRes, locRes] = await Promise.all([
        apiClient.get("/categories"),
        apiClient.get("/locations"),
      ]);
      if (catRes.data?.data) setCategories(catRes.data.data);
      if (locRes.data?.data) setLocations(locRes.data.data);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load categories and locations.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Category Actions
  const handleOpenCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: "", code: "", description: "", color: "#0284c7" });
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name,
      code: cat.code,
      description: cat.description || "",
      color: cat.color || "#0284c7",
    });
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await apiClient.put(`/categories/${editingCategory._id}`, categoryForm);
        toast.success(`Category '${categoryForm.name}' updated successfully.`);
      } else {
        await apiClient.post("/categories", categoryForm);
        toast.success(`Category '${categoryForm.name}' created successfully.`);
      }
      setIsCategoryModalOpen(false);
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to save category.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    setIsSubmitting(true);
    try {
      await apiClient.delete(`/categories/${deletingCategory._id}`);
      toast.success(`Category '${deletingCategory.name}' deleted.`);
      setDeletingCategory(null);
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Cannot delete category.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Location Actions
  const handleOpenCreateLocation = () => {
    setEditingLocation(null);
    setLocationForm({
      name: "",
      building: "",
      floor: "Ground",
      roomNumber: "",
      capacity: 40,
      type: "Academic",
      notes: "",
    });
    setIsLocationModalOpen(true);
  };

  const handleOpenEditLocation = (loc: LocationItem) => {
    setEditingLocation(loc);
    setLocationForm({
      name: loc.name,
      building: loc.building,
      floor: loc.floor || "Ground",
      roomNumber: loc.roomNumber || "",
      capacity: loc.capacity || 0,
      type: loc.type || "Academic",
      notes: loc.notes || "",
    });
    setIsLocationModalOpen(true);
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingLocation) {
        await apiClient.put(`/locations/${editingLocation._id}`, locationForm);
        toast.success(`Location '${locationForm.name}' updated.`);
      } else {
        await apiClient.post("/locations", locationForm);
        toast.success(`Location '${locationForm.name}' created.`);
      }
      setIsLocationModalOpen(false);
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to save location.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLocation = async () => {
    if (!deletingLocation) return;
    setIsSubmitting(true);
    try {
      await apiClient.delete(`/locations/${deletingLocation._id}`);
      toast.success(`Location '${deletingLocation.name}' deleted.`);
      setDeletingLocation(null);
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Cannot delete location.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Categories & Campus Facilities</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage venue classifications, academic buildings, lecture rooms, and enforce referential integrity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin text-green-600" : ""} />
          </button>

          {canManage && (
            <button
              onClick={activeTab === "categories" ? handleOpenCreateCategory : handleOpenCreateLocation}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-100 hover:bg-violet-200 text-violet-800 rounded-lg text-sm font-bold shadow-sm transition-colors cursor-pointer border border-violet-200"
            >
              <Plus size={16} />
              <span>{activeTab === "categories" ? "New Category" : "New Location"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("categories")}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === "categories"
              ? "border-green-600 text-green-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Layers size={17} />
          <span>Resource Categories ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("locations")}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === "locations"
              ? "border-green-600 text-green-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <MapPin size={17} />
          <span>Buildings & Places ({locations.length})</span>
        </button>
      </div>

      {/* TAB 1: CATEGORIES */}
      {activeTab === "categories" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <div
              key={cat._id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: cat.color || "#0284c7" }}
                  ></span>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {cat.code}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base mt-2">{cat.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {cat.description || "No specific description recorded."}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-green-800 bg-green-50 px-2 py-0.5 rounded">
                  {cat.resourceCount || 0} active resources
                </span>

                {canManage && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditCategory(cat)}
                      className="p-1.5 text-slate-400 hover:text-green-700 hover:bg-slate-100 rounded cursor-pointer"
                      title="Edit Category"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setDeletingCategory(cat)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: LOCATIONS */}
      {activeTab === "locations" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4 pl-6">Facility Name</th>
                  <th className="py-3.5 px-4">Building</th>
                  <th className="py-3.5 px-4">Floor & Room</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4 text-center">Capacity</th>
                  <th className="py-3.5 px-4 text-center">Linked Resources</th>
                  <th className="py-3.5 px-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {locations.map((loc) => (
                  <tr key={loc._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 pl-6 font-semibold text-slate-900">{loc.name}</td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">{loc.building}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {loc.floor || "Ground"} {loc.roomNumber ? `• ${loc.roomNumber}` : ""}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                        {loc.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                      {loc.capacity || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                        {loc.resourceCount || 0}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 pr-6 text-right">
                      {canManage && (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditLocation(loc)}
                            className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded cursor-pointer"
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => setDeletingLocation(loc)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CATEGORY FORM MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-violet-900/20 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-violet-50 border-b border-violet-100 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingCategory ? `Edit: ${editingCategory.name}` : "Create Category"}
              </h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smart Classroom"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Code (Unique) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SMT-ROOM"
                  value={categoryForm.code}
                  onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm uppercase focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
                <textarea
                  rows={2}
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Color Tag</label>
                <input
                  type="color"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                  className="w-full h-10 p-1 border border-slate-300 rounded-lg cursor-pointer"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-violet-200 hover:bg-violet-300 text-violet-900 rounded-lg text-sm font-bold disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOCATION FORM MODAL */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-violet-900/20 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-violet-50 border-b border-violet-100 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingLocation ? `Edit: ${editingLocation.name}` : "Create Campus Location"}
              </h3>
              <button onClick={() => setIsLocationModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveLocation} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Facility Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Complex Wing A"
                  value={locationForm.name}
                  onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Building *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Technology Building C"
                  value={locationForm.building}
                  onChange={(e) => setLocationForm({ ...locationForm, building: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Floor</label>
                  <input
                    type="text"
                    placeholder="e.g. 2nd Floor"
                    value={locationForm.floor}
                    onChange={(e) => setLocationForm({ ...locationForm, floor: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Room No</label>
                  <input
                    type="text"
                    placeholder="e.g. C-204"
                    value={locationForm.roomNumber}
                    onChange={(e) => setLocationForm({ ...locationForm, roomNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Capacity</label>
                  <input
                    type="number"
                    value={locationForm.capacity}
                    onChange={(e) => setLocationForm({ ...locationForm, capacity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Type</label>
                  <select
                    value={locationForm.type}
                    onChange={(e) => setLocationForm({ ...locationForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                  >
                    <option value="Academic">Academic</option>
                    <option value="Administrative">Administrative</option>
                    <option value="Laboratory">Laboratory</option>
                    <option value="Auditorium">Auditorium</option>
                    <option value="Outdoor">Outdoor</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-violet-200 hover:bg-violet-300 text-violet-900 rounded-lg text-sm font-bold disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Location"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODALS */}
      <ConfirmModal
        isOpen={!!deletingCategory}
        title="Delete Category"
        message={`Are you sure you want to delete '${deletingCategory?.name}'? The system will reject this deletion if any campus resources are currently linked to this category.`}
        confirmText="Yes, Delete Category"
        isLoading={isSubmitting}
        onConfirm={handleDeleteCategory}
        onCancel={() => setDeletingCategory(null)}
      />

      <ConfirmModal
        isOpen={!!deletingLocation}
        title="Delete Location"
        message={`Are you sure you want to delete '${deletingLocation?.name}'? Deletion will be rejected if resources reference this location.`}
        confirmText="Yes, Delete Location"
        isLoading={isSubmitting}
        onConfirm={handleDeleteLocation}
        onCancel={() => setDeletingLocation(null)}
      />
    </div>
  );
};

export default CategoriesLocationsPage;




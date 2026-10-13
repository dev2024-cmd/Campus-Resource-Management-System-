import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Shield,
  RefreshCw,
  Mail,
  Building,
} from "lucide-react";
import apiClient from "../services/api";
import { User, UserRole } from "../types";
import ConfirmModal from "../components/common/ConfirmModal";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedRole, setSelectedRole] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const initialForm = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "lecturer" as UserRole,
    department: "Computer Science",
    phoneNumber: "",
    status: "active" as const,
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedRole !== "All") params.append("role", selectedRole);
      if (searchTerm) params.append("search", searchTerm);
      params.append("limit", "20");

      const res = await apiClient.get(`/users?${params.toString()}`);
      if (res.data?.data) {
        setUsers(res.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load user directory.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [selectedRole, searchTerm]);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData(initialForm);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setFormData({
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      password: "", // Leave blank if not updating
      role: u.role,
      department: u.department || "General",
      phoneNumber: u.phoneNumber || "",
      status: u.status,
    });
    setIsCreateOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingUser) {
        const payload: any = { ...formData };
        if (!payload.password) delete payload.password;
        await apiClient.put(`/users/${editingUser._id}`, payload);
        toast.success(`User '${formData.email}' updated.`);
      } else {
        await apiClient.post("/users", formData);
        toast.success(`User '${formData.email}' registered successfully.`);
      }
      setIsCreateOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save user account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setIsSubmitting(true);
    try {
      await apiClient.delete(`/users/${deletingUser._id}`);
      toast.success(`User account '${deletingUser.email}' removed.`);
      setDeletingUser(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Cannot delete user account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">User Accounts & Access Control</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage institutional administrative permissions, faculty credentials, and role delegations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin text-green-600" : ""} />
          </button>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-100 hover:bg-violet-200 text-violet-800 rounded-lg text-sm font-bold shadow-sm transition-colors cursor-pointer border border-violet-200"
          >
            <Plus size={16} />
            <span>Create New User</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name, email, department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="All">All Roles</option>
          <option value="superadmin">Super Admin</option>
          <option value="admin">Administrator</option>
          <option value="lecturer">Lecturer / Faculty</option>
          <option value="student">Student</option>
          <option value="staff">Staff</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4 pl-6">Full Name</th>
                <th className="py-3.5 px-4">Institutional Email</th>
                <th className="py-3.5 px-4">System Role</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Contact Phone</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading user accounts from MongoDB...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <Users size={36} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No user accounts found.</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 pl-6">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-700 text-green-400 flex items-center justify-center font-bold text-xs uppercase">
                          {u.firstName?.[0] || ""}{u.lastName?.[0] || ""}
                        </div>
                        <span className="font-semibold text-slate-900">
                          {u.firstName} {u.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider font-mono bg-green-50 text-green-800 border border-green-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{u.department || "General"}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-xs">{u.phoneNumber || "—"}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          u.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 pr-6 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded cursor-pointer"
                          title="Edit User"
                        >
                          <Pencil size={15} />
                        </button>
                        {currentUser?._id !== u._id && (
                          <button
                            onClick={() => setDeletingUser(u)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer"
                            title="Delete User"
                          >
                            <Trash2 size={15} />
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

      {/* CREATE / EDIT USER MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-violet-900/20 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-violet-50 border-b border-violet-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  {editingUser ? `Edit Account: ${editingUser.email}` : "Create New User Account"}
                </h3>
                <p className="text-xs text-green-200">Enforces salted bcrypt hashing and JWT role validation</p>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Institutional Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {editingUser ? "New Password (Leave blank to keep current)" : "Password *"}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  placeholder={editingUser ? "Unchanged" : "••••••••••••"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">System Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                  >
                    <option value="superadmin">Super Admin</option>
                    <option value="admin">Administrator</option>
                    <option value="lecturer">Lecturer / Faculty</option>
                    <option value="student">Student</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
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
                  className="px-5 py-2 bg-violet-200 hover:bg-violet-300 text-violet-900 rounded-lg text-sm font-bold shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Persisting User..." : "Save Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE */}
      <ConfirmModal
        isOpen={!!deletingUser}
        title="Delete User Account"
        message={`Are you sure you want to delete user account '${deletingUser?.email}'? This action cannot be reversed.`}
        confirmText="Yes, Delete User"
        isLoading={isSubmitting}
        onConfirm={handleDeleteUser}
        onCancel={() => setDeletingUser(null)}
      />
    </div>
  );
};

export default UsersPage;




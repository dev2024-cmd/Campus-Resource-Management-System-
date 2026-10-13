import React, { useState, useEffect } from "react";
import {
  FileBarChart,
  Download,
  Shield,
  Activity,
  Layers,
  Building,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";
import apiClient from "../services/api";
import { AuditLogItem } from "../types";
import { toast } from "react-toastify";

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"utilization" | "audit" | "export">("utilization");
  const [isLoading, setIsLoading] = useState(true);

  // Utilization & Cost data
  const [utilizationData, setUtilizationData] = useState<any>(null);
  const [costData, setCostData] = useState<any>(null);

  // Audit Logs data
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [selectedEntity, setSelectedEntity] = useState("All");
  const [selectedAction, setSelectedAction] = useState("All");

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const [utilRes, costRes] = await Promise.all([
        apiClient.get("/reports/utilization"),
        apiClient.get("/reports/maintenance-costs"),
      ]);
      if (utilRes.data?.data) setUtilizationData(utilRes.data.data);
      if (costRes.data?.data) setCostData(costRes.data.data);
    } catch (err) {
      console.error("Error fetching reports:", err);
      toast.error("Failed to load utilization and cost reports.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedEntity !== "All") params.append("entity", selectedEntity);
      if (selectedAction !== "All") params.append("action", selectedAction);
      params.append("limit", "50");

      const res = await apiClient.get(`/audit-logs?${params.toString()}`);
      if (res.data?.data) {
        setAuditLogs(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      toast.error("Failed to load audit history.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "utilization") {
      fetchReports();
    } else if (activeTab === "audit") {
      fetchAuditLogs();
    }
  }, [activeTab, selectedEntity, selectedAction]);

  const handleExportResources = async () => {
    try {
      toast.info("Generating Campus Resources CSV export...");
      const res = await apiClient.get("/reports/export/resources", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `campus_resources_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Downloaded resources CSV successfully.");
    } catch (err) {
      toast.error("Failed to export resources CSV.");
    }
  };

  const handleExportBookings = async () => {
    try {
      toast.info("Generating Campus Bookings CSV export...");
      const res = await apiClient.get("/reports/export/bookings", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `campus_bookings_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Downloaded bookings CSV successfully.");
    } catch (err) {
      toast.error("Failed to export bookings CSV.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Analytics, Reports & Audit Trail</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Evaluate facility utilization rates, maintenance costs, export official institutional CSV records, and audit actions.
          </p>
        </div>

        <button
          onClick={() => (activeTab === "audit" ? fetchAuditLogs() : fetchReports())}
          className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          title="Refresh"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin text-green-600" : ""} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("utilization")}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === "utilization"
              ? "border-green-600 text-green-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Activity size={17} />
          <span>Utilization & Cost Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab("export")}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === "export"
              ? "border-green-600 text-green-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Download size={17} />
          <span>Data Exports (CSV)</span>
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === "audit"
              ? "border-green-600 text-green-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Shield size={17} />
          <span>Immutable Audit Log</span>
        </button>
      </div>

      {/* TAB 1: UTILIZATION & COST */}
      {activeTab === "utilization" && (
        <div className="space-y-6">
          {/* Category Utilization Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Resource Utilization by Category</h3>
              <p className="text-xs text-slate-500">Allocation and maintenance rates across facility types</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4 pl-6">Venue Category</th>
                    <th className="py-3 px-4 text-center">Total Inventory</th>
                    <th className="py-3 px-4 text-center">Allocated</th>
                    <th className="py-3 px-4 text-center">Under Maintenance</th>
                    <th className="py-3 px-4 text-center">Available</th>
                    <th className="py-3 px-4 pr-6">Utilization Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {utilizationData?.categoryStats?.map((c: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 pl-6 font-semibold text-slate-900">{c.category}</td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-700">{c.total}</td>
                      <td className="py-3.5 px-4 text-center text-green-700 font-semibold">{c.allocated}</td>
                      <td className="py-3.5 px-4 text-center text-amber-700 font-semibold">{c.underMaintenance}</td>
                      <td className="py-3.5 px-4 text-center text-emerald-700 font-semibold">{c.available}</td>
                      <td className="py-3.5 px-4 pr-6">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-violet-300 h-2 rounded-full"
                              style={{ width: `${c.utilizationRate}%` }}
                            ></div>
                          </div>
                          <span className="font-bold text-xs text-slate-800 w-12 text-right">
                            {c.utilizationRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Maintenance Cost Breakdown Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Facility Maintenance Financial Overview</h3>
              <p className="text-xs text-slate-500">Budget estimations vs actual incurred expenses by ticket status</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4 pl-6">Ticket Status</th>
                    <th className="py-3 px-4 text-center">Ticket Count</th>
                    <th className="py-3 px-4 text-right">Total Estimated Budget</th>
                    <th className="py-3 px-4 pr-6 text-right">Total Actual Incurred</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {costData?.costSummary?.map((cs: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 pl-6 font-semibold text-slate-900">{cs._id}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-700">{cs.count}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600">${cs.totalEstimated.toLocaleString()}</td>
                      <td className="py-3.5 px-4 pr-6 text-right font-mono font-bold text-emerald-700">
                        ${cs.totalActual.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EXPORT CSV */}
      {activeTab === "export" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="p-3 bg-green-50 text-green-700 rounded-xl w-fit mb-3">
                <Building size={24} />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Full Campus Resource Inventory</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Export complete catalogue including Unique Resource Codes, classifications, buildings, room allocations, capacities, hardware condition, and specifications.
              </p>
            </div>
            <button
              onClick={handleExportResources}
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-violet-100 hover:bg-violet-200 text-violet-800 font-bold text-sm rounded-lg shadow-sm transition-colors cursor-pointer border border-violet-200"
            >
              <Download size={16} />
              <span>Download Resources CSV</span>
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl w-fit mb-3">
                <FileBarChart size={24} />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Historical Bookings & Allocations</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Export complete historical reservation records including Booking Codes, event purposes, requesting faculties, dates, session windows, approval statuses, and notes.
              </p>
            </div>
            <button
              onClick={handleExportBookings}
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-sm rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Download size={16} />
              <span>Download Bookings CSV</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT TRAIL */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          {/* Audit Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-3">
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="All">All Entities</option>
              <option value="Resource">Resource Events</option>
              <option value="Booking">Booking Events</option>
              <option value="Maintenance">Maintenance Events</option>
              <option value="Category">Category Events</option>
              <option value="Location">Location Events</option>
              <option value="User">User Account Events</option>
            </select>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4 pl-6">Timestamp</th>
                    <th className="py-3.5 px-4">Action</th>
                    <th className="py-3.5 px-4">Target Entity</th>
                    <th className="py-3.5 px-4">Performed By</th>
                    <th className="py-3.5 px-4">IP Address</th>
                    <th className="py-3.5 px-4 pr-6">Event Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 pl-6 font-mono text-xs text-slate-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-green-800">
                        {log.action}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                          {log.entity}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{log.userName}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-mono">{log.userRole}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                        {log.ipAddress || "127.0.0.1"}
                      </td>
                      <td className="py-3.5 px-4 pr-6 text-slate-700 max-w-sm text-xs">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;




import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  CheckCircle2,
  Clock,
  Wrench,
  CalendarDays,
  Users,
  RefreshCw,
  Plus,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Layers,
} from "lucide-react";
import apiClient from "../services/api";
import { DashboardStats } from "../types";
import StatsCard from "../components/common/StatsCard";
import Badge from "../components/common/Badge";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/dashboard/stats");
      if (response.data?.data) {
        setStats(response.data.data);
      }
    } catch (error: any) {
      console.error("Dashboard fetch error:", error);
      toast.error("Failed to fetch live dashboard statistics.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const summary = stats?.summary || {
    totalResources: 0,
    availableResources: 0,
    allocatedResources: 0,
    maintenanceResources: 0,
    reservedResources: 0,
    totalBookings: 0,
    pendingBookings: 0,
    approvedBookings: 0,
    activeMaintenance: 0,
    totalUsers: 0,
    utilizationRate: 0,
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-green-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-green-900 tracking-tight">
            Welcome back, {user?.firstName || "Administrator"}
          </h1>
          <p className="text-sm text-green-600 mt-1">
            Real-time campus asset oversight, venue allocations, and facility maintenance status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            title="Refresh Live Data"
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-green-200 hover:bg-green-50 text-green-700 rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin text-green-600" : ""} />
            <span>Sync Stats</span>
          </button>

          <Link
            to="/bookings"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-100 hover:bg-violet-200 text-violet-800 rounded-lg text-xs font-bold shadow-sm transition-colors"
          >
            <Plus size={15} />
            <span>Book Venue</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatsCard
          title="Total Resources"
          value={summary.totalResources}
          subtext="Catalogued Assets"
          icon={<Building2 size={22} />}
          iconBg="bg-green-50"
          iconColor="text-green-700"
        />

        <StatsCard
          title="Available Places"
          value={summary.availableResources}
          subtext="Open for Booking"
          icon={<CheckCircle2 size={22} />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />

        <StatsCard
          title="Allocated / In Use"
          value={summary.allocatedResources}
          subtext="Active Sessions"
          icon={<Layers size={22} />}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
        />

        <StatsCard
          title="Under Maintenance"
          value={summary.maintenanceResources}
          subtext="Unavailable"
          icon={<Wrench size={22} />}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />

        <StatsCard
          title="Pending Requests"
          value={summary.pendingBookings}
          subtext="Awaiting Approval"
          icon={<Clock size={22} />}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
        />

        <StatsCard
          title="Active Tickets"
          value={summary.activeMaintenance}
          subtext="Open Fault Orders"
          icon={<AlertTriangle size={22} />}
          iconBg="bg-rose-50"
          iconColor="text-rose-500"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Resource Distribution by Category */}
          <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-green-900 text-base">Resource Distribution by Category</h3>
                <p className="text-xs text-green-500">Live breakdown of campus halls, laboratories, and specialized venues</p>
              </div>
              <Link to="/resources" className="text-xs font-semibold text-green-600 hover:text-green-800 flex items-center gap-1">
                <span>View All</span>
                <ArrowUpRight size={14} />
              </Link>
            </div>

            {stats?.charts?.categoryDistribution && stats.charts.categoryDistribution.length > 0 ? (
              <div className="space-y-3">
                {stats.charts.categoryDistribution.map((item, index) => {
                  const percentage = summary.totalResources > 0 ? Math.round((item.count / summary.totalResources) * 100) : 0;
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-green-800">{item.name}</span>
                        <span className="text-green-500">{item.count} items ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-green-50 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-green-400 text-sm">No categorized resources available.</div>
            )}
          </div>

          {/* Upcoming Approved Bookings Table */}
          <div className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-green-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-green-900 text-base">Upcoming Confirmed Bookings</h3>
                <p className="text-xs text-green-500">Upcoming reserved sessions across lecture halls and auditoriums</p>
              </div>
              <Link to="/bookings" className="text-xs font-semibold text-green-600 hover:text-green-800 flex items-center gap-1">
                <span>All Bookings</span>
                <ArrowUpRight size={14} />
              </Link>
            </div>

            {stats?.upcomingBookings && stats.upcomingBookings.length > 0 ? (
              <div className="divide-y divide-green-50">
                {stats.upcomingBookings.map((bk) => (
                  <div key={bk._id} className="p-4 hover:bg-green-50/50 transition-colors flex items-center justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-green-900 truncate">{bk.purpose}</span>
                        <Badge variant="approved">Confirmed</Badge>
                      </div>
                      <div className="text-xs text-green-500 flex flex-wrap items-center gap-3">
                        <span className="font-medium text-green-700">{bk.resourceName}</span>
                        <span>&bull;</span>
                        <span>{bk.date}</span>
                        <span>&bull;</span>
                        <span>{bk.startTime} - {bk.endTime}</span>
                        <span>&bull;</span>
                        <span className="text-green-600 font-medium">By {bk.userName}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-semibold text-green-600 px-2 py-1 bg-green-50 rounded border border-green-100">
                        {bk.bookingCode}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-green-400 text-sm">No upcoming confirmed bookings scheduled.</div>
            )}
          </div>
        </div>

        {/* Right 1 Column */}
        <div className="space-y-6">
          {/* Campus Utilization Metric — pastel green card */}
          <div className="bg-violet-100 rounded-2xl p-6 text-violet-900 shadow-md border border-violet-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-600">Campus Capacity Load</span>
              <Activity size={18} className="text-violet-400" />
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-violet-900">{summary.utilizationRate}%</span>
              <span className="text-xs text-violet-500">utilization rate</span>
            </div>
            <p className="text-xs text-violet-600 mt-2 leading-relaxed">
              Calculated from current live allocated resources vs available college infrastructure inventory.
            </p>
            <div className="mt-4 pt-4 border-t border-violet-200 flex justify-between text-xs text-violet-600">
              <span>Allocated: {summary.allocatedResources}</span>
              <span>Available: {summary.availableResources}</span>
              <span>Maint: {summary.maintenanceResources}</span>
            </div>
          </div>

          {/* Urgent Maintenance Warnings */}
          <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-green-900 text-sm flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-500" />
                <span>Priority Maintenance Tickets</span>
              </h3>
              <Link to="/maintenance" className="text-xs text-green-600 hover:underline font-semibold">
                Manage
              </Link>
            </div>

            {stats?.urgentMaintenance && stats.urgentMaintenance.length > 0 ? (
              <div className="space-y-3">
                {stats.urgentMaintenance.map((m) => (
                  <div key={m._id} className="p-3 rounded-xl bg-amber-50 border border-amber-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-green-900 truncate">{m.issueTitle}</span>
                      <Badge variant="urgent">{m.priority}</Badge>
                    </div>
                    <div className="text-[11px] text-green-500">
                      Resource: <span className="font-medium text-green-800">{m.resourceName}</span>
                    </div>
                    <div className="text-[11px] text-green-500 flex justify-between">
                      <span>Assigned: {m.assignedTo || "Unassigned"}</span>
                      <span className="font-medium text-amber-700">{m.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-green-400 bg-green-50 rounded-xl">
                No critical maintenance alerts at this time.
              </div>
            )}
          </div>

          {/* Live Administrative Audit Trail */}
          <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-green-900 text-sm flex items-center gap-2">
                <TrendingUp size={16} className="text-green-600" />
                <span>Live Administrative Audit Feed</span>
              </h3>
              <Link to="/reports" className="text-xs text-green-600 hover:underline font-semibold">
                Full Log
              </Link>
            </div>

            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {stats.recentActivity.slice(0, 6).map((log) => (
                  <div key={log._id} className="text-xs flex items-start gap-2.5 pb-2.5 border-b border-green-50 last:border-0 last:pb-0">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-green-800 leading-snug">{log.details}</div>
                      <div className="text-[10px] text-green-400 mt-0.5 flex items-center justify-between">
                        <span>{log.userName} &bull; {log.userRole}</span>
                        <span>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-green-400">No activity records found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

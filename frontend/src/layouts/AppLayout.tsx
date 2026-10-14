import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  Wrench,
  Users,
  FileBarChart,
  Layers,
  LogOut,
  Menu,
  X,
  Bell,
  Clock,
  ShieldCheck,
  ChevronRight,
  Database,
  User as UserIcon,
  RefreshCw,
  Leaf,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import axios from "axios";

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: "reminder" | "booking" | "event" | "maintenance" | "system";
  resourceName?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  isRead: boolean;
  createdAt: string;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  roles?: string[];
  badge?: string;
}

export const AppLayout: React.FC = () => {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsList, setNotificationsList] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/notifications");
      if (res.data?.data) {
        setNotificationsList(res.data.data);
        setUnreadCount(res.data.unreadCount ?? res.data.data.filter((n: any) => !n.isRead).length);
      }
    } catch (err) {
      console.error("Error loading notifications in AppLayout:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await axios.patch(`http://localhost:5000/api/notifications/${id}/read`);
      setNotificationsList((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.patch("http://localhost:5000/api/notifications/mark-all-read");
      setNotificationsList((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await axios.delete(`http://localhost:5000/api/notifications/${id}`);
      setNotificationsList((prev) => prev.filter((n) => n._id !== id));
      toast.info("Notification dismissed");
    } catch (err) {
      console.error("Error dismissing notification:", err);
    }
  };

  const navigation: NavItem[] = [
    { name: "Executive Dashboard", path: "/dashboard", icon: <LayoutDashboard size={19} /> },
    { name: "Resource Catalog", path: "/resources", icon: <Building2 size={19} /> },
    { name: "Categories & Places", path: "/categories-locations", icon: <Layers size={19} /> },
    { name: "Booking & Allocation", path: "/bookings", icon: <CalendarDays size={19} /> },
    { name: "Maintenance & Faults", path: "/maintenance", icon: <Wrench size={19} /> },
    { name: "Users & Roles", path: "/users", icon: <Users size={19} />, roles: ["superadmin", "admin"] },
    { name: "Reports & Audit Logs", path: "/reports", icon: <FileBarChart size={19} />, roles: ["superadmin", "admin"] },
  ];

  const handleLogout = () => {
    logout();
    toast.info("Signed out of administrative console.");
    navigate("/login");
  };

  const getPageTitle = () => {
    const current = navigation.find((item) => location.pathname.startsWith(item.path));
    if (current) return current.name;
    if (location.pathname === "/profile") return "User Profile";
    return "Campus Management";
  };

  const filteredNav = navigation.filter((item) => {
    if (!item.roles) return true;
    return hasRole(...(item.roles as any));
  });

  return (
    <div className="min-h-screen bg-green-50 flex flex-col font-sans text-slate-700">
      {/* Desktop Persistent Left Sidebar */}
      <aside className="hidden lg:flex w-64 bg-violet-50 text-violet-900 flex-col fixed inset-y-0 left-0 z-30 shadow-md border-r border-violet-200">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-violet-200 bg-violet-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-300 flex items-center justify-center text-violet-900 font-bold shadow-md shadow-violet-200/60">
              CR
            </div>
            <div>
              <div className="font-bold text-sm tracking-wide text-violet-900 leading-tight">Campus Resource</div>
              <div className="text-[11px] text-violet-500 font-medium">Administration Portal</div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-violet-400">
            System Modules
          </div>
          {filteredNav.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== "/dashboard" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-violet-200 text-violet-900 shadow-sm"
                    : "text-violet-600 hover:text-violet-900 hover:bg-violet-100"
                }`}
              >
                <span className={isActive ? "text-violet-800" : "text-violet-400"}>{item.icon}</span>
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-violet-200 text-violet-700 border border-violet-300">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom User Quick Info & Logout */}
        <div className="p-4 border-t border-violet-200 bg-violet-100">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-8 h-8 rounded-full bg-violet-200 flex items-center justify-center text-violet-700 font-bold text-xs uppercase">
              {user ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}` : "U"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-violet-900 truncate">
                {user ? `${user.firstName} ${user.lastName}` : "Administrator"}
              </div>
              <div className="text-[10px] text-violet-500 uppercase tracking-wider font-mono">
                {user?.role || "Staff"}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200 cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Body Area */}
      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-green-200 sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-green-700 hover:bg-green-100 rounded-lg"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Breadcrumb / Title */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-green-600 hidden sm:inline">College Management</span>
              <ChevronRight size={14} className="text-green-400 hidden sm:inline" />
              <h1 className="text-base sm:text-lg font-bold text-green-900 tracking-tight">
                {getPageTitle()}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* MongoDB Connection Status Pill */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-medium">
              <Database size={13} className="text-green-600" />
              <span>MongoDB Connected</span>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            </div>

            {/* Role Badge */}
            <span className="hidden sm:inline-flex px-2.5 py-1 text-xs font-semibold rounded-md bg-green-100 text-green-700 border border-green-200 uppercase tracking-wider font-mono">
              {user?.role || "Staff"}
            </span>

            {/* Notification Bell & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
                title="Notifications & Schedule Reminders"
                className="relative p-2 rounded-full hover:bg-green-50 text-green-800 border border-green-200 transition-all flex items-center justify-center cursor-pointer shadow-sm hover:border-green-300"
              >
                <Bell size={18} className="text-green-700" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full shadow animate-pulse border border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Menu */}
              {notificationDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setNotificationDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[520px] bg-white rounded-2xl shadow-2xl border border-green-200 z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-3.5 px-4 border-b border-green-100 flex items-center justify-between bg-green-50/70">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-green-950 text-sm">Schedule Reminders</span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-xs font-semibold text-green-700 hover:text-green-900 cursor-pointer"
                          >
                            Mark all read
                          </button>
                        )}
                        <button
                          onClick={() => setNotificationDropdownOpen(false)}
                          className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="overflow-y-auto divide-y divide-green-50 max-h-[400px]">
                      {notificationsList.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 space-y-2">
                          <Bell className="w-9 h-9 mx-auto text-green-200" />
                          <p className="text-xs font-medium text-gray-600">No active notifications</p>
                          <p className="text-[11px] text-gray-400">
                            When your scheduled resource bookings or events conclude, reminders will appear here automatically.
                          </p>
                        </div>
                      ) : (
                        notificationsList.map((n) => (
                          <div
                            key={n._id}
                            onClick={() => !n.isRead && handleMarkAsRead(n._id)}
                            className={`p-3.5 hover:bg-green-50/50 transition-colors cursor-pointer flex items-start gap-3 ${
                              !n.isRead ? "bg-amber-50/50" : "bg-white"
                            }`}
                          >
                            <div
                              className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                                n.type === "reminder"
                                  ? "bg-amber-100 text-amber-700 border border-amber-200"
                                  : "bg-green-100 text-green-700 border border-green-200"
                              }`}
                            >
                              <Clock size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-bold text-gray-900 truncate">{n.title}</span>
                                <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                  {n.createdAt
                                    ? new Date(n.createdAt).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "Just now"}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 mt-1 leading-relaxed">{n.message}</p>
                              {(n.scheduledDate || n.scheduledTime) && (
                                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded w-fit">
                                  <CalendarDays size={12} />
                                  <span>
                                    {n.scheduledDate} {n.scheduledTime && `• ${n.scheduledTime}`}
                                  </span>
                                </div>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNotification(n._id);
                              }}
                              className="text-gray-300 hover:text-rose-500 p-1 shrink-0 cursor-pointer"
                              title="Dismiss"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Menu Trigger */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1.5 pl-2.5 pr-3 rounded-full hover:bg-green-50 text-green-800 border border-green-200 transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-violet-200 text-violet-800 flex items-center justify-center font-bold text-xs uppercase">
                  {user ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}` : "AD"}
                </div>
                <span className="text-xs font-medium hidden md:inline">{user?.firstName || "Admin"}</span>
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-green-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2.5 border-b border-green-100">
                    <div className="text-sm font-semibold text-green-900">
                      {user ? `${user.firstName} ${user.lastName}` : "Campus User"}
                    </div>
                    <div className="text-xs text-green-600 truncate">{user?.email}</div>
                    <div className="text-[11px] text-green-500 font-medium capitalize mt-0.5">
                      {user?.department || "Campus Operations"}
                    </div>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut size={14} />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs flex">
            <div className="w-64 bg-violet-50 text-violet-900 p-5 flex flex-col justify-between shadow-2xl border-r border-violet-200">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-violet-200">
                  <div className="font-bold text-sm text-violet-700">Campus Resource System</div>
                  <button onClick={() => setMobileMenuOpen(false)} className="text-violet-400">
                    <X size={20} />
                  </button>
                </div>
                <nav className="mt-4 space-y-1">
                  {filteredNav.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-violet-700 hover:bg-violet-100 hover:text-violet-900"
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </nav>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-rose-500 text-xs font-semibold hover:bg-rose-50 rounded-lg"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)}></div>
          </div>
        )}

        {/* Content Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

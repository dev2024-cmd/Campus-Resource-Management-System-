import React, { useState } from "react";
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
  ShieldCheck,
  ChevronRight,
  Database,
  User as UserIcon,
  RefreshCw,
  Leaf,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

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

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Shield, Building, Lock, Mail, CheckCircle2, Leaf } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("expired")) {
      toast.warning("Your session expired. Please log in again.");
    }
  }, [location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please provide both email address and password.");
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        toast.success("Welcome! Signed in successfully.");
        navigate("/dashboard");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Invalid credentials. Please verify your email and password.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoCredentials = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
  };

  return (
    <div className="min-h-screen bg-green-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-violet-200 flex items-center justify-center text-violet-800 shadow-xl shadow-violet-200/60">
            <Building size={32} />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-extrabold text-violet-900 tracking-tight">
          Campus Resource Management
        </h2>
        <p className="mt-1.5 text-center text-xs sm:text-sm text-violet-500">
          College Administrative Portal &bull; Academic Operations
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-lg rounded-2xl sm:px-10 border border-green-100">
          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-bold text-violet-700 uppercase tracking-wider">
                Institutional Email
              </label>
              <div className="mt-1 relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-violet-300">
                  <Mail size={17} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. admin@campus.edu"
                  className="block w-full pl-10 pr-3 py-2.5 border border-violet-200 rounded-lg text-sm text-violet-900 placeholder-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-violet-700 uppercase tracking-wider">
                Password
              </label>
              <div className="mt-1 relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-violet-300">
                  <Lock size={17} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 border border-violet-200 rounded-lg text-sm text-violet-900 placeholder-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-violet-300 hover:text-violet-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-violet-900 bg-violet-200 hover:bg-violet-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-300 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Authenticating with MongoDB...
                  </span>
                ) : (
                  "Sign In to Management Console"
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="mt-6 pt-5 border-t border-green-100">
            <p className="text-xs font-semibold text-green-500 uppercase tracking-wider text-center mb-3">
              Quick Role Switcher (Preloaded Demo Accounts)
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDemoCredentials("superadmin@campus.edu", "Admin@123456")}
                className="p-2 border border-green-200 rounded-lg text-green-800 hover:bg-green-50 hover:border-green-400 font-medium text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-green-900">Super Admin</div>
                <div className="text-[10px] text-green-500">Full IT System Control</div>
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials("admin@campus.edu", "Admin@123456")}
                className="p-2 border border-green-200 rounded-lg text-green-800 hover:bg-green-50 hover:border-green-400 font-medium text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-green-900">Campus Admin</div>
                <div className="text-[10px] text-green-500">Resource & Bookings</div>
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials("faculty@campus.edu", "Faculty@123456")}
                className="p-2 border border-green-200 rounded-lg text-green-800 hover:bg-green-50 hover:border-green-400 font-medium text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-green-900">Faculty / Lecturer</div>
                <div className="text-[10px] text-green-500">Book Places & Faults</div>
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials("student@campus.edu", "Student@123456")}
                className="p-2 border border-green-200 rounded-lg text-green-800 hover:bg-green-50 hover:border-green-400 font-medium text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-green-900">Student / Staff</div>
                <div className="text-[10px] text-green-500">Browse Availability</div>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-1.5 text-xs text-green-600">
            <CheckCircle2 size={13} className="text-green-500" />
            <span>Secure bcrypt salted hashing &amp; JWT authentication active</span>
          </div>
        </div>
      </div>
    </div>
  );
}

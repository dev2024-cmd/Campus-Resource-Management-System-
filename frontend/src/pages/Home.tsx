import React from "react";
import { Link } from "react-router-dom";
import { LogIn, GraduationCap, School, Shield } from "lucide-react";

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-emerald-50/50 text-slate-800 flex flex-col justify-center items-center px-4">
      <div className="max-w-xl w-full text-center space-y-6 bg-white p-8 rounded-2xl border border-violet-100 shadow-lg">
        <div className="flex justify-center">
          <div className="p-4 bg-violet-100 rounded-full border border-violet-200">
            <School className="w-16 h-16 text-violet-600" />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 sm:text-4xl">
          Smart Campus Management System
        </h1>

        <p className="text-slate-500 text-sm sm:text-base">
          Welcome to the unified campus portal. Log in with your campus credentials to access your dashboard, lectures, courses, and announcements.
        </p>

        <div className="pt-2">
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl font-bold text-violet-900 bg-violet-200 hover:bg-violet-300 border border-violet-300 transition-all shadow-sm text-lg"
          >
            <LogIn className="w-5 h-5" />
            Go to Login
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-4 text-xs text-violet-700 border-t border-slate-100">
          <div className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-violet-50 border border-violet-100">
            <GraduationCap className="w-4 h-4 text-violet-500" />
            <span>Lecturer &amp; Student Portals</span>
          </div>
          <div className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Administrator Control</span>
          </div>
        </div>

        <div className="text-xs text-slate-600 bg-emerald-50/80 p-3 rounded-lg border border-emerald-100 text-left">
          <span className="font-semibold text-emerald-800">Demo Login:</span>
          <br />Email: <code className="text-emerald-700">vidusha@gmail.com</code> | Password: <code className="text-emerald-700">123</code>
        </div>
      </div>
    </div>
  );
};

export default Home;

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const ResetPassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  return (
    <div className="flex min-h-screen items-center justify-center bg-violet-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96 max-w-md border border-violet-100">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Reset Password</h2>

        <form className="space-y-4">
          {/* New Password Field */}
          <div>
            <label className="block text-slate-700 text-sm font-medium">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="mt-1 w-full px-4 py-2 border border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-300 outline-none text-slate-800"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center text-slate-400"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-slate-700 text-sm font-medium">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="mt-1 w-full px-4 py-2 border border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-300 outline-none text-slate-800"
                placeholder="********"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center text-slate-400"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button className="w-full bg-violet-200 hover:bg-violet-300 text-violet-900 border border-violet-300 font-bold p-3 rounded-lg transition cursor-pointer">
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;


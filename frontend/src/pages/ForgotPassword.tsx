import { useState } from "react";
import { Link } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Reset email sent to:", email);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-violet-50">
      <div className="bg-white shadow-lg rounded-lg p-8 w-96">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Forgot Password?</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-violet-200 hover:bg-violet-300 text-violet-900 font-semibold p-3 rounded-md transition cursor-pointer"
          >
            Send Email
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link to="/login" className="text-violet-600 hover:underline flex items-center justify-center">
            &larr; Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;


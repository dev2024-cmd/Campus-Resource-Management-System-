import React from "react";

interface BadgeProps {
  variant?: "available" | "allocated" | "maintenance" | "reserved" | "pending" | "approved" | "rejected" | "cancelled" | "completed" | "default" | "high" | "urgent" | "medium" | "low";
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = "default", children, className = "" }) => {
  const getStyles = () => {
    switch (variant.toLowerCase()) {
      case "available":
      case "approved":
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "allocated":
        return "bg-teal-100 text-teal-700 border-teal-200";
      case "maintenance":
      case "urgent":
      case "high":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "reserved":
      case "pending":
      case "medium":
        return "bg-violet-100 text-violet-700 border-violet-200";
      case "rejected":
        return "bg-rose-100 text-rose-700 border-rose-200";
      case "cancelled":
      case "low":
        return "bg-slate-100 text-slate-600 border-slate-200";
      default:
        return "bg-green-50 text-green-700 border-green-200";
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStyles()} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;

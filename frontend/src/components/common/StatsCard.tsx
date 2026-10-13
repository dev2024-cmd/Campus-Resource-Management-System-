import React from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  trend?: string;
  trendPositive?: boolean;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtext,
  icon,
  iconBg = "bg-green-50",
  iconColor = "text-green-700",
  trend,
  trendPositive = true,
}) => {
  return (
    <div className="bg-white rounded-xl border border-green-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-green-500">{title}</p>
          <h3 className="text-2xl font-bold text-green-900 mt-1">{value}</h3>
          {subtext && <p className="text-xs text-green-500 mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-xl ${iconBg} ${iconColor} shrink-0`}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t border-green-50 flex items-center gap-1.5 text-xs">
          <span className={`font-semibold ${trendPositive ? "text-green-600" : "text-amber-600"}`}>
            {trend}
          </span>
          <span className="text-green-400">vs last period</span>
        </div>
      )}
    </div>
  );
};

export default StatsCard;

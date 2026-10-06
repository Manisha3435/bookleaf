import React from "react";
import clsx from "clsx";

interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | "critical"
    | "high"
    | "medium"
    | "low"
    | "open"
    | "in_progress"
    | "waiting"
    | "resolved"
    | "closed"
    | "default"
    | "author"
    | "admin";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  className,
}) => {
  const styles: Record<string, string> = {
    critical: "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/30 font-semibold",
    high: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/30 font-semibold",
    medium: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30",
    low: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/30",
    open: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-medium",
    in_progress: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30 font-medium",
    waiting: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/30 font-medium",
    resolved: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/30",
    closed: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border border-gray-500/30",
    author: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/30",
    admin: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-500/30 font-semibold",
    default: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide shadow-xs transition-all",
        styles[variant] || styles.default,
        className
      )}
    >
      {children}
    </span>
  );
};

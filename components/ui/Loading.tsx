import React from "react";

export const Loading: React.FC<{ message?: string }> = ({
  message = "Loading...",
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center min-h-[250px]">
      <div className="relative w-12 h-12">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-[#E4F2EE] dark:border-emerald-950 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-[#116654] rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-400 animate-pulse">
        {message}
      </p>
    </div>
  );
};

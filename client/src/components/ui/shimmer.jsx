import React from 'react';

// Base shimmer animation
const shimmerAnimation = "animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700";

// Basic shimmer component
export const Shimmer = ({ className = "", children, ...props }) => (
  <div className={`${shimmerAnimation} ${className}`} {...props}>
    {children}
  </div>
);

// Text shimmer variants
export const TextShimmer = ({ lines = 1, className = "" }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, index) => (
      <Shimmer key={index} className="h-4 rounded w-full" />
    ))}
  </div>
);

// Card shimmer
export const CardShimmer = ({ className = "" }) => (
  <Shimmer className={`rounded-lg p-6 ${className}`}>
    <div className="space-y-4">
      <Shimmer className="h-6 w-3/4 rounded" />
      <Shimmer className="h-4 w-1/2 rounded" />
      <Shimmer className="h-8 w-full rounded" />
    </div>
  </Shimmer>
);

// Stats card shimmer
export const StatsCardShimmer = () => (
  <div className="flex items-center justify-between w-full h-48 gap-5 px-4 py-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700">
    <div className="flex items-center w-full h-full gap-4">
      <Shimmer className="w-12 h-12 rounded-full" />
      <div className="space-y-3 flex-1">
        <Shimmer className="h-5 w-24 rounded" />
        <Shimmer className="h-8 w-32 rounded" />
        <Shimmer className="h-4 w-20 rounded" />
      </div>
    </div>
  </div>
);

// Account card shimmer
export const AccountCardShimmer = () => (
  <div className="w-full h-48 flex gap-4 bg-gray-50 dark:bg-slate-800 p-3 rounded shadow">
    <Shimmer className="w-12 h-12 rounded-full" />
    <div className="space-y-2 w-full">
      <div className="flex items-center justify-between">
        <Shimmer className="h-6 w-32 rounded" />
        <Shimmer className="w-6 h-6 rounded" />
      </div>
      <Shimmer className="h-4 w-40 rounded" />
      <Shimmer className="h-3 w-48 rounded" />
      <div className="flex items-center justify-between pt-2">
        <Shimmer className="h-6 w-24 rounded" />
        <Shimmer className="h-4 w-20 rounded" />
      </div>
    </div>
  </div>
);

// Table shimmer
export const TableShimmer = ({ rows = 5, columns = 5 }) => (
  <div className="overflow-x-auto mt-5">
    <table className="w-full">
      <thead className="w-full border-b border-gray-300 dark:border-gray-700">
        <tr className="w-full">
          {Array.from({ length: columns }).map((_, index) => (
            <th key={index} className="py-2 px-2">
              <Shimmer className="h-4 w-20 rounded" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <tr key={rowIndex} className="border-b border-gray-200 dark:border-gray-700">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <td key={colIndex} className="py-4 px-2">
                <Shimmer className="h-4 w-full rounded" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Chart shimmer
export const ChartShimmer = () => (
  <div className="flex-1 w-full p-4 bg-white rounded-lg shadow-sm dark:bg-gray-800">
    <Shimmer className="h-6 w-48 rounded mb-5" />
    <Shimmer className="w-full h-[500px] rounded" />
  </div>
);

// Pie chart shimmer
export const PieChartShimmer = () => (
  <div className="w-full md:w-1/3 p-6 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
    <Shimmer className="h-6 w-40 rounded mb-5" />
    <div className="flex items-center justify-center">
      <Shimmer className="w-60 h-60 rounded-full" />
    </div>
  </div>
);

// Settings form shimmer
export const SettingsFormShimmer = () => (
  <div className="space-y-6">
    {/* Name Fields */}
    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="w-full space-y-2">
        <Shimmer className="h-4 w-20 rounded" />
        <Shimmer className="h-10 w-full rounded-lg" />
      </div>
      <div className="w-full space-y-2">
        <Shimmer className="h-4 w-20 rounded" />
        <Shimmer className="h-10 w-full rounded-lg" />
      </div>
    </div>

    {/* Contact Fields */}
    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="w-full space-y-2">
        <Shimmer className="h-4 w-24 rounded" />
        <Shimmer className="h-10 w-full rounded-lg" />
      </div>
      <div className="w-full space-y-2">
        <Shimmer className="h-4 w-28 rounded" />
        <Shimmer className="h-10 w-full rounded-lg" />
      </div>
    </div>

    {/* Location Fields */}
    <div className="flex flex-col md:flex-row items-start justify-between gap-4">
      <div className="w-full space-y-2">
        <Shimmer className="h-4 w-16 rounded" />
        <Shimmer className="h-10 w-full rounded-lg" />
      </div>
      <div className="w-full space-y-2">
        <Shimmer className="h-4 w-16 rounded" />
        <Shimmer className="h-10 w-full rounded-lg" />
      </div>
    </div>

    {/* Theme Section */}
    <div className="w-full flex items-center justify-between pt-10 border-t border-gray-200 dark:border-gray-800">
      <div className="space-y-2">
        <Shimmer className="h-6 w-24 rounded" />
        <Shimmer className="h-4 w-64 rounded" />
      </div>
      <Shimmer className="w-40 h-10 rounded-lg" />
    </div>

    {/* Language Section */}
    <div className="w-full flex items-center justify-between pb-10 border-b border-gray-200 dark:border-gray-800">
      <div className="space-y-2">
        <Shimmer className="h-6 w-20 rounded" />
        <Shimmer className="h-4 w-56 rounded" />
      </div>
      <Shimmer className="w-40 h-10 rounded-lg" />
    </div>

    {/* Buttons */}
    <div className="flex items-center gap-6 justify-end pb-10 border-b-2 border-gray-200 dark:border-gray-800">
      <Shimmer className="w-20 h-10 rounded" />
      <Shimmer className="w-24 h-10 rounded" />
    </div>
  </div>
);

export default Shimmer;

import { motion } from "framer-motion";

export const TableSkeleton = ({ rows = 5, columns = 5 }) => {
  return (
    <div className="space-y-4">
      {[...Array(rows)].map((_, rowIndex) => (
        <motion.div
          key={rowIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: rowIndex * 0.1 }}
          className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100"
        >
          {[...Array(columns)].map((_, colIndex) => (
            <div
              key={colIndex}
              className="h-4 bg-gray-200 rounded animate-pulse"
              style={{ 
                width: colIndex === 0 ? '20%' : colIndex === columns - 1 ? '15%' : `${60 / (columns - 2)}%` 
              }}
            />
          ))}
        </motion.div>
      ))}
    </div>
  );
};

export const CardSkeleton = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse" />
      </div>
      <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
    </motion.div>
  );
};

export const StatsCardSkeleton = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    </motion.div>
  );
};

export const GridSkeleton = ({ items = 8 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(items)].map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="h-48 bg-gray-200 animate-pulse" />
          <div className="p-5 space-y-3">
            <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-1/3 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export const PageSkeleton = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"
        />
        <p className="text-gray-500 font-medium">Loading...</p>
      </div>
    </div>
  );
};

export default { TableSkeleton, CardSkeleton, StatsCardSkeleton, GridSkeleton, PageSkeleton };

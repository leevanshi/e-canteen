import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUp, ArrowDown, Calendar, User, Wallet, RefreshCw, Search, Download, X, Filter } from "lucide-react";
import { getWalletHistory } from "../api";
import { formatApiError } from "../utils/formatApiError";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";

const formatIST = (date) => {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
};

const AdminWalletHistory = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("all");
  const [customDateRange, setCustomDateRange] = useState({ start: "", end: "" });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    if (authLoading) return;
    if (!user) navigate("/login", { replace: true });
    else if (user.role !== "admin") navigate("/menu", { replace: true });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!authLoading && user?.role === "admin") {
      fetchWalletHistory();
    }
  }, [authLoading, user]);

  const fetchWalletHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getWalletHistory();
      const data = res?.data || [];
      setTransactions(data);
    } catch (err) {
      const msg = formatApiError(err?.response?.data?.detail, "Failed to load wallet history");
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ================= FILTER LOGIC ================= */

  const filterTransactions = (transactionsToFilter) => {
    let filtered = transactionsToFilter;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(txn => {
        const userName = txn.user_name || "";
        const userEmail = txn.user_email || "";
        const description = txn.description || "";
        
        return (
          userName.toLowerCase().includes(query) ||
          userEmail.toLowerCase().includes(query) ||
          description.toLowerCase().includes(query)
        );
      });
    }

    // Filter by transaction type
    if (transactionTypeFilter !== "all") {
      filtered = filtered.filter(txn => txn.type === transactionTypeFilter);
    }

    // Filter by date
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (dateFilter === "today") {
      filtered = filtered.filter(txn => {
        const txnDate = new Date(txn.created_at);
        return txnDate >= today;
      });
    } else if (dateFilter === "week") {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(txn => {
        const txnDate = new Date(txn.created_at);
        return txnDate >= weekAgo;
      });
    } else if (dateFilter === "month") {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filtered = filtered.filter(txn => {
        const txnDate = new Date(txn.created_at);
        return txnDate >= monthAgo;
      });
    } else if (dateFilter === "custom" && customDateRange.start && customDateRange.end) {
      const startDate = new Date(customDateRange.start);
      const endDate = new Date(customDateRange.end);
      endDate.setHours(23, 59, 59);
      filtered = filtered.filter(txn => {
        const txnDate = new Date(txn.created_at);
        return txnDate >= startDate && txnDate <= endDate;
      });
    }

    return filtered;
  };

  const filteredTransactions = useMemo(() => filterTransactions(transactions), [transactions, searchQuery, dateFilter, transactionTypeFilter, customDateRange]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateFilter, transactionTypeFilter, customDateRange]);

  /* ================= EXPORT FUNCTION ================= */

  const exportToCSV = () => {
    const headers = ["Transaction ID", "User Name", "Email", "Amount", "Type", "Description", "Previous Balance", "New Balance", "Admin", "Date"];
    const rows = filteredTransactions.map(txn => [
      txn._id || "",
      txn.user_name || "",
      txn.user_email || "",
      txn.amount || 0,
      txn.type || "",
      txn.description || "",
      txn.previous_balance || 0,
      txn.new_balance || 0,
      txn.admin_name || "",
      txn.created_at ? new Date(txn.created_at).toLocaleString('en-IN') : ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `wallet-history-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* HEADER */}
      <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Wallet History</h1>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate("/admin/wallet")}
                className="flex items-center gap-2"
              >
                ← Back to Wallet
              </Button>
              <Button
                variant="outline"
                onClick={fetchWalletHistory}
                className="flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/admin")}
                className="flex items-center gap-2"
              >
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-semibold mb-1">Failed to load wallet history</p>
                <p className="text-sm">{error}</p>
              </div>
              <Button
                variant="outline"
                onClick={fetchWalletHistory}
                className="w-full sm:w-auto"
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* FILTERS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by user name, email, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Transaction Type Filter */}
            <select
              value={transactionTypeFilter}
              onChange={(e) => setTransactionTypeFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none"
            >
              <option value="all">All Types</option>
              <option value="credit">Credits</option>
              <option value="debit">Debits</option>
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>

            {dateFilter === "custom" && (
              <div className="flex gap-2">
                <input
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none"
                />
                <input
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none"
                />
              </div>
            )}

            {/* Export Button */}
            <Button
              onClick={exportToCSV}
              disabled={filteredTransactions.length === 0}
              className="flex items-center gap-2"
            >
              <Download size={16} />
              Export CSV
            </Button>
          </div>
        </div>

        {filteredTransactions.length === 0 && !loading ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-gray-100 text-center">
            <Wallet size={64} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No wallet transactions found</h3>
            <p className="text-gray-500">
              {searchQuery || dateFilter !== "all" || transactionTypeFilter !== "all"
                ? "Try adjusting your filters"
                : "Wallet transactions will appear here once users top up or place orders"}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Transaction History</h2>
                <p className="text-sm text-gray-500 mt-1">{filteredTransactions.length} transactions found</p>
              </div>
              <span className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {paginatedTransactions.map((transaction, index) => (
                <motion.div
                  key={transaction._id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          transaction.type === "credit"
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {transaction.type === "credit" ? (
                          <ArrowDown size={24} />
                        ) : (
                          <ArrowUp size={24} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{transaction.description}</p>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <User size={14} />
                            {transaction.user_name || "Unknown"}
                          </span>
                          {transaction.user_email && (
                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                              {transaction.user_email}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {formatIST(transaction.created_at)}
                          </span>
                          {transaction.admin_name && (
                            <span className="flex items-center gap-1 text-xs">
                              <Filter size={12} />
                              {transaction.admin_name}
                            </span>
                          )}
                        </div>
                        {(transaction.previous_balance !== undefined || transaction.new_balance !== undefined) && (
                          <div className="mt-2 text-xs text-gray-500">
                            Balance: ₹{transaction.previous_balance || 0} → ₹{transaction.new_balance || 0}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex sm:flex-row sm:items-center sm:justify-between gap-2">
                      <p
                        className={`text-xl sm:text-2xl font-bold ${
                          transaction.type === "credit" ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {transaction.type === "credit" ? "+" : "-"}₹{Math.abs(transaction.amount).toFixed(2)}
                      </p>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          transaction.type === "credit"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {transaction.type === "credit" ? "Credit" : "Debit"}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="px-4 sm:px-6 py-4 border-t border-gray-100 flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2"
                >
                  Previous
                </Button>
                <div className="flex gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded-lg ${
                          currentPage === pageNum
                            ? "bg-orange-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminWalletHistory;

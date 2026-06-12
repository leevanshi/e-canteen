import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUp, ArrowDown, Calendar, User, Wallet, RefreshCw } from "lucide-react";
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
                Back to Dashboard
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
                <p className="text-sm">Please check server connection.</p>
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

        {transactions.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-gray-100 text-center">
            <Wallet size={64} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No wallet transactions yet</h3>
            <p className="text-gray-500">Wallet transactions will appear here once users top up or place orders.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">Transaction History</h2>
              <p className="text-sm text-gray-500 mt-1">{transactions.length} transactions found</p>
            </div>
            <div className="divide-y divide-gray-100">
              {transactions.map((transaction, index) => (
                <motion.div
                  key={transaction._id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {formatIST(transaction.created_at)}
                          </span>
                          {transaction._id && (
                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                              ID: {transaction._id.toString().slice(-8)}
                            </span>
                          )}
                        </div>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminWalletHistory;

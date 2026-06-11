import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUp, ArrowDown, Calendar, User, Wallet } from "lucide-react";
import { getWalletHistory } from "../api";
import { formatApiError } from "../utils/formatApiError";
import { useAuth } from "../context/AuthContext";

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
      <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/admin/wallet")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Wallet History</h1>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                <Wallet size={14} className="text-orange-500" /> All wallet transactions
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm mb-6">
            {error}
          </div>
        )}

        {transactions.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 shadow-sm border border-gray-100 text-center">
            <Wallet size={64} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Transactions Found</h3>
            <p className="text-gray-500">Wallet transactions will appear here once users top up or place orders.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
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
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
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
                      <div>
                        <p className="font-semibold text-gray-900">{transaction.description}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <User size={14} />
                            {transaction.user_name || "Unknown"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {formatIST(transaction.created_at)}
                          </span>
                          {transaction.order_id && (
                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                              Order: {transaction.order_id}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-2xl font-bold ${
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

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Wallet, RefreshCw, ArrowUpRight, ArrowDown, User, Mail, DollarSign, AlertCircle } from "lucide-react";

import { getUsers, adminAddMoney } from "../api";
import { formatApiError } from "../utils/formatApiError";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";
import { theme } from "../theme";

const AdminWalletPage = () => {

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const role = (user?.role || "").toLowerCase();

  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [amounts, setAmounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [updatingUser, setUpdatingUser] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  /* ================= AUTH GUARD ================= */

  useEffect(() => {

    if (authLoading) return;

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    if (role !== "admin") {
      navigate("/menu", { replace: true });
    }

  }, [authLoading, user, role, navigate]);

  /* ================= FETCH USERS ================= */

  const fetchUsers = async () => {

    try {

      setLoading(true);
      setFetchError(null);

      const res = await getUsers();
      const data = Array.isArray(res?.data) ? res.data : (res?.data?.users || []);

      const safeUsers = data.map((u, idx) => ({
        _id: u?._id || u?.id || `user-${idx}`,
        name: u?.name || "User",
        email: u?.email || "—",
        wallet_balance: Number(u?.wallet_balance || u?.balance || 0),
        wallet_first_time: Boolean(u?.wallet_first_time)
      }));

      setUsers(safeUsers);

    } catch (err) {

      console.error("User fetch error:", err);
      const msg = formatApiError(err?.response?.data?.detail,
        err?.response ? "Failed to load users" : "Backend unreachable — check API URL and CORS");
      setFetchError(msg);
      toast.error(msg);

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    if (!authLoading && role === "admin") {
      fetchUsers();
    }

  }, [authLoading, role]);

  /* ================= FILTER USERS ================= */

  const filteredUsers = useMemo(() => {

    const term = (search || "").toLowerCase();

    return users.filter((u) =>
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term)
    );

  }, [users, search]);

  /* ================= ADD MONEY ================= */

  const addMoney = async (userId) => {

    const raw = amounts[userId];
    const amount = Number(raw);

    if (!amount || amount <= 0) {
      toast.error("Enter valid amount");
      return;
    }

    if (amount > 10000) {
      toast.error("Maximum ₹10000 allowed");
      return;
    }

    try {

      setUpdatingUser(userId);

      const res = await adminAddMoney({
        user_id: userId,
        amount: amount
      });

      const newBalance =
        res?.data?.balance ??
        res?.data?.new_balance ??
        null;

      toast.success(`₹${amount} added successfully`);

      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId
            ? {
                ...u,
                wallet_balance:
                  newBalance !== null
                    ? newBalance
                    : u.wallet_balance + amount
              }
            : u
        )
      );

      setAmounts((prev) => ({
        ...prev,
        [userId]: ""
      }));

    } catch (err) {

      console.error("Add money error:", err);

      toast.error(formatApiError(err?.response?.data?.detail, "Failed to add money"));

    } finally {

      setUpdatingUser(null);

    }

  };

  /* ================= LOADING STATE ================= */

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-500 font-medium">Loading wallet data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* HEADER */}
      <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Wallet Management</h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <Wallet size={14} className="text-orange-500" /> Manage student wallet balances
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={fetchUsers}
              className="flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/admin/wallet-history")}
              className="flex items-center gap-2"
            >
              <ArrowUpRight size={16} />
              Wallet History
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/admin/dashboard")}
              className="flex items-center gap-2"
            >
              Dashboard
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* ERROR STATE */}
        {fetchError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 mb-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} />
              <div>
                <p className="font-semibold">Failed to load users</p>
                <p className="text-sm">{fetchError}</p>
              </div>
            </div>
            <Button variant="outline" onClick={fetchUsers}>Retry</Button>
          </div>
        )}

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Users</p>
                <p className="text-3xl font-black text-gray-900 mt-1">{users.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                <User size={24} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Balance</p>
                <p className="text-3xl font-black text-gray-900 mt-1">
                  ₹{users.reduce((sum, u) => sum + u.wallet_balance, 0).toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 text-green-500 rounded-xl flex items-center justify-center">
                <DollarSign size={24} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">First-Time Users</p>
                <p className="text-3xl font-black text-gray-900 mt-1">
                  {users.filter(u => u.wallet_first_time).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center">
                <AlertCircle size={24} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Filtered Results</p>
                <p className="text-3xl font-black text-gray-900 mt-1">{filteredUsers.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center">
                <Search size={24} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* SEARCH BAR */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* EMPTY STATE */}
        {filteredUsers.length === 0 && (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
            <Search size={64} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500">Try adjusting your search criteria</p>
          </div>
        )}

        {/* USERS TABLE */}
        {filteredUsers.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">User Wallets ({filteredUsers.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Balance</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((u, index) => (
                    <motion.tr
                      key={u._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{u.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail size={16} />
                          <span className="text-sm">{u.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xl font-bold text-green-600">₹{u.wallet_balance.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        {u.wallet_first_time ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                            <AlertCircle size={12} />
                            First-time
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="10000"
                            placeholder="Amount"
                            className="w-24 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                            value={amounts[u._id] || ""}
                            onChange={(e) =>
                              setAmounts((prev) => ({
                                ...prev,
                                [u._id]: e.target.value
                              }))
                            }
                          />
                          <Button
                            disabled={updatingUser === u._id}
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                            onClick={() => addMoney(u._id)}
                          >
                            {updatingUser === u._id ? (
                              <span className="flex items-center gap-2">
                                <RefreshCw size={16} className="animate-spin" />
                                Adding...
                              </span>
                            ) : (
                              <span className="flex items-center gap-2">
                                <ArrowDown size={16} />
                                Add Funds
                              </span>
                            )}
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );

};

export default AdminWalletPage;
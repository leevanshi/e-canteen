import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Wallet, RefreshCw, ArrowUpRight, ArrowDown, User, Mail, DollarSign, AlertCircle, TrendingUp, Calendar, X, Trash2 } from "lucide-react";

import { getUsers, adminAddMoney, getWalletAnalytics, deleteUser } from "../api";
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
  const [analytics, setAnalytics] = useState(null);
  const [showUsersCreditedModal, setShowUsersCreditedModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);

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
      fetchAnalytics();
    }

  }, [authLoading, role]);

  /* ================= FETCH ANALYTICS ================= */

  const fetchAnalytics = async () => {
    try {
      const res = await getWalletAnalytics();
      setAnalytics(res?.data || {});
    } catch (err) {
      console.error("Analytics fetch error:", err);
      // Don't show error toast, just log it
    }
  };

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

      // Refresh analytics after adding funds
      fetchAnalytics();

    } catch (err) {

      console.error("Add money error:", err);

      toast.error(formatApiError(err?.response?.data?.detail, "Failed to add money"));

    } finally {

      setUpdatingUser(null);

    }

  };

  /* ================= DELETE USER ================= */

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setDeletingUser(userToDelete._id);
      
      await deleteUser(userToDelete._id);
      
      toast.success(`User ${userToDelete.name} deleted successfully`);
      
      // Remove user from list
      setUsers((prev) => prev.filter((u) => u._id !== userToDelete._id));
      
      // Close modal
      setShowDeleteModal(false);
      setUserToDelete(null);
      
      // Refresh analytics
      fetchAnalytics();
      
    } catch (err) {
      console.error("Delete user error:", err);
      toast.error(formatApiError(err?.response?.data?.detail, "Failed to delete user"));
    } finally {
      setDeletingUser(null);
    }
  };

  const openDeleteModal = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
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
            className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 shadow-sm border border-emerald-100 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setShowUsersCreditedModal(true)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Users Credited Today</p>
                <p className="text-3xl font-black text-gray-900 mt-1">{analytics?.users_credited_today || 0}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center">
                <TrendingUp size={24} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-sm border border-blue-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Today's Credits</p>
                <p className="text-3xl font-black text-gray-900 mt-1">₹{(analytics?.today_credits || 0).toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 text-white rounded-xl flex items-center justify-center">
                <DollarSign size={24} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 shadow-sm border border-purple-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Credits This Month</p>
                <p className="text-3xl font-black text-gray-900 mt-1">₹{(analytics?.month_credits || 0).toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500 text-white rounded-xl flex items-center justify-center">
                <Calendar size={24} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* USERS CREDITED TODAY MODAL */}
        {showUsersCreditedModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-bold">Users Credited Today</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowUsersCreditedModal(false)}>
                  <X size={20} />
                </Button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {analytics?.users_credited_today_details?.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.users_credited_today_details.map((detail, index) => (
                      <div key={index} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-gray-900">{detail.user_name}</p>
                            <p className="text-sm text-gray-500">{detail.user_email}</p>
                          </div>
                          <p className="text-xl font-bold text-emerald-600">₹{detail.amount_credited.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {detail.credited_at ? new Date(detail.credited_at).toLocaleString('en-IN') : '—'}
                          </span>
                          <span className="flex items-center gap-1">
                            <User size={14} />
                            {detail.admin_name}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Wallet size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">No users credited today</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openDeleteModal(u)}
                            disabled={deletingUser === u._id}
                          >
                            <Trash2 size={16} />
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

        {/* DELETE USER CONFIRMATION MODAL */}
        {showDeleteModal && userToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                    <Trash2 size={24} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Delete User</h2>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                  <p className="text-sm text-red-800 mb-2">Are you sure you want to permanently delete this user?</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Username:</span>
                      <span className="font-semibold">{userToDelete.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-semibold">{userToDelete.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Wallet Balance:</span>
                      <span className="font-semibold">₹{userToDelete.wallet_balance?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Orders:</span>
                      <span className="font-semibold">{userToDelete.order_count || 0}</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">
                  This will mark the user as deleted. Order history and wallet transactions will be preserved for audit purposes.
                </p>
                
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setUserToDelete(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteUser}
                    disabled={deletingUser === userToDelete._id}
                    className="flex-1"
                  >
                    {deletingUser === userToDelete._id ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw size={16} className="animate-spin" />
                        Deleting...
                      </span>
                    ) : (
                      "Delete Permanently"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

};

export default AdminWalletPage;
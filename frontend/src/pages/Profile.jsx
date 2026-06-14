import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Wallet, 
  ShoppingBag, 
  DollarSign, 
  Clock, 
  Edit, 
  Lock, 
  Camera, 
  Download, 
  X, 
  ArrowLeft,
  CreditCard,
  TrendingUp,
  RefreshCw
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { 
  getProfile, 
  updateProfile, 
  changePassword, 
  uploadProfilePhoto,
  getProfileTransactions 
} from "../api";
import { formatApiError } from "../utils/formatApiError";
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

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);

  // Form states
  const [editForm, setEditForm] = useState({ name: "", phone: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [addFundsAmount, setAddFundsAmount] = useState("");

  // Loading states
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [addingFunds, setAddingFunds] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    fetchProfile();
    fetchTransactions();
  }, [authLoading, user, navigate]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getProfile();
      setProfile(res?.data || null);
      setEditForm({ 
        name: res?.data?.name || "", 
        phone: res?.data?.phone || "" 
      });
    } catch (err) {
      console.error("Profile fetch error:", err);
      const msg = formatApiError(err?.response?.data?.detail, "Failed to load profile");
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await getProfileTransactions();
      setTransactions(res?.data?.transactions || []);
    } catch (err) {
      console.error("Transactions fetch error:", err);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setUpdatingProfile(true);
      await updateProfile(editForm);
      toast.success("Profile updated successfully");
      setShowEditModal(false);
      fetchProfile();
    } catch (err) {
      console.error("Profile update error:", err);
      toast.error(formatApiError(err?.response?.data?.detail, "Failed to update profile"));
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setChangingPassword(true);
      await changePassword(passwordForm);
      toast.success("Password changed successfully");
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      console.error("Password change error:", err);
      toast.error(formatApiError(err?.response?.data?.detail, "Failed to change password"));
    } finally {
      setChangingPassword(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    try {
      setUploadingPhoto(true);
      await uploadProfilePhoto(file);
      toast.success("Profile photo uploaded successfully");
      fetchProfile();
    } catch (err) {
      console.error("Photo upload error:", err);
      toast.error("Failed to upload profile photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleAddFunds = async () => {
    const amount = Number(addFundsAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (amount > 10000) {
      toast.error("Maximum amount is ₹10,000");
      return;
    }

    try {
      setAddingFunds(true);
      // TODO: Integrate with payment gateway
      toast.success("Payment integration coming soon");
      setShowAddFundsModal(false);
      setAddFundsAmount("");
    } catch (err) {
      console.error("Add funds error:", err);
      toast.error("Failed to add funds");
    } finally {
      setAddingFunds(false);
    }
  };

  const downloadTransactions = () => {
    const headers = ["Date", "Type", "Amount", "Description", "Previous Balance", "New Balance"];
    const rows = transactions.map(t => [
      formatIST(t.created_at),
      t.type,
      t.amount,
      t.description,
      t.previous_balance || 0,
      t.new_balance || 0
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Transactions downloaded");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* HEADER */}
      <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft size={18} className="mr-2" /> Back
            </Button>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Profile</h1>
              <p className="text-sm text-gray-500 mt-1">Manage your account and wallet</p>
            </div>
          </div>
          <Button variant="outline" onClick={fetchProfile}>
            <RefreshCw size={16} className="mr-2" /> Refresh
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6">
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {profile && (
          <>
            {/* PROFILE HEADER */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-4xl font-bold">
                    {profile.profile_photo ? (
                      <img src={profile.profile_photo} alt="Profile" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      profile.name?.charAt(0).toUpperCase() || "U"
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-orange-500 text-white p-2 rounded-full cursor-pointer hover:bg-orange-600 transition-colors">
                    <Camera size={16} />
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <RefreshCw size={20} className="text-white animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 capitalize">
                      {profile.role}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Mail size={14} />
                      {profile.email}
                    </span>
                    {profile.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={14} />
                        {profile.phone}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      Joined {formatIST(profile.created_at).split(",")[0]}
                    </span>
                  </div>
                </div>
                <Button onClick={() => setShowEditModal(true)} className="flex items-center gap-2">
                  <Edit size={16} /> Edit Profile
                </Button>
              </div>
            </motion.div>

            {/* STATISTICS CARDS */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 shadow-sm border border-orange-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center">
                    <Wallet size={20} />
                  </div>
                  <span className="text-sm text-gray-600">Wallet</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">₹{profile.wallet_balance?.toLocaleString() || 0}</p>
                <p className="text-sm text-gray-500 mt-1">Current Balance</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-sm border border-blue-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-blue-500 text-white rounded-xl flex items-center justify-center">
                    <ShoppingBag size={20} />
                  </div>
                  <span className="text-sm text-gray-600">Orders</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{profile.total_orders || 0}</p>
                <p className="text-sm text-gray-500 mt-1">Total Placed</p>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 shadow-sm border border-emerald-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center">
                    <DollarSign size={20} />
                  </div>
                  <span className="text-sm text-gray-600">Spent</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">₹{profile.total_spent?.toLocaleString() || 0}</p>
                <p className="text-sm text-gray-500 mt-1">Total Amount</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 shadow-sm border border-purple-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-purple-500 text-white rounded-xl flex items-center justify-center">
                    <Clock size={20} />
                  </div>
                  <span className="text-sm text-gray-600">Pending</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{profile.pending_orders || 0}</p>
                <p className="text-sm text-gray-500 mt-1">Orders</p>
              </div>
            </motion.div>

            {/* WALLET CARD */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl shadow-lg p-8 text-white">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <p className="text-orange-100 text-sm mb-1">Wallet Balance</p>
                  <p className="text-5xl font-bold">₹{profile.wallet_balance?.toLocaleString() || 0}</p>
                  {profile.last_order_date && (
                    <p className="text-orange-100 text-sm mt-2">
                      Last order: {formatIST(profile.last_order_date)}
                    </p>
                  )}
                </div>
                <Button 
                  onClick={() => setShowAddFundsModal(true)}
                  className="bg-white text-orange-600 hover:bg-orange-50 font-semibold"
                >
                  <CreditCard size={16} className="mr-2" /> Add Funds
                </Button>
              </div>
            </motion.div>

            {/* TRANSACTION HISTORY */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Transaction History</h2>
                <Button variant="outline" onClick={downloadTransactions} disabled={transactions.length === 0}>
                  <Download size={16} className="mr-2" /> Download CSV
                </Button>
              </div>
              {transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Type</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Amount</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Description</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((txn, idx) => (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="py-3 px-4 text-gray-600">{formatIST(txn.created_at)}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              txn.type === "credit" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                            }`}>
                              {txn.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-gray-900">
                            {txn.type === "credit" ? "+" : "-"}₹{txn.amount}
                          </td>
                          <td className="py-3 px-4 text-gray-600">{txn.description}</td>
                          <td className="py-3 px-4 text-gray-900">₹{txn.new_balance || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Wallet size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No transactions yet</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>

      {/* EDIT PROFILE MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">Edit Profile</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none"
                />
              </div>
            </div>
            <div className="p-6 border-t flex gap-3">
              <Button variant="outline" onClick={() => setShowEditModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleUpdateProfile} disabled={updatingProfile} className="flex-1">
                {updatingProfile ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">Change Password</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowPasswordModal(false)}>
                <X size={20} />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none"
                />
              </div>
            </div>
            <div className="p-6 border-t flex gap-3">
              <Button variant="outline" onClick={() => setShowPasswordModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleChangePassword} disabled={changingPassword} className="flex-1">
                {changingPassword ? "Changing..." : "Change Password"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ADD FUNDS MODAL */}
      {showAddFundsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">Add Funds</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowAddFundsModal(false)}>
                <X size={20} />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={addFundsAmount}
                  onChange={(e) => setAddFundsAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum: ₹10,000</p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <p className="text-sm text-orange-800">
                  <strong>Note:</strong> Payment gateway integration coming soon. 
                  Currently, you can request credits from admin.
                </p>
              </div>
            </div>
            <div className="p-6 border-t flex gap-3">
              <Button variant="outline" onClick={() => setShowAddFundsModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleAddFunds} disabled={addingFunds} className="flex-1 bg-orange-500 hover:bg-orange-600">
                {addingFunds ? "Processing..." : "Proceed to Payment"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

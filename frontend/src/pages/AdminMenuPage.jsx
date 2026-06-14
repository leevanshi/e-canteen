import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Search, RefreshCw, ArrowUpRight, Utensils, DollarSign, AlertCircle, CheckCircle2, Filter, Grid, List } from "lucide-react";
import API, { toggleMenuAvailability } from "../api";
import { useAuth } from "../context/AuthContext";
import { formatApiError } from "../utils/formatApiError";
import { theme } from "../theme";

const AdminMenuPage = () => {

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const role = (user?.role || "").toLowerCase();

  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const BASE_URL = API.defaults.baseURL;

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

  /* ================= FETCH MENU ================= */

  const fetchMenu = async () => {

    try {

      const res = await API.get("/menu/admin");

      const data = Array.isArray(res?.data)
        ? res.data
        : res?.data?.menu || [];

      const safeMenu = data.map((item, idx) => ({
        ...item,
        _id: item._id || item.id || `item-${idx}`,
        price: Number(item.price || 0),
        available: item.available !== false
      }));

      setMenu(safeMenu);

    } catch (err) {

      console.error(err);
      toast.error(formatApiError(err?.response?.data?.detail, "Failed to load menu"));

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    if (!authLoading && role === "admin") {
      fetchMenu();
    }

  }, [authLoading, role]);

  /* ================= TOGGLE AVAILABILITY ================= */

  const toggleAvailability = async (item) => {

    if (updatingId === item._id) return;

    setUpdatingId(item._id);

    try {

      const res = await toggleMenuAvailability(item._id);
      const newAvailable = res?.data?.available ?? !item.available;

      setMenu((prev) =>
        prev.map((i) =>
          i._id === item._id
            ? { ...i, available: newAvailable }
            : i
        )
      );

      toast.success(
        `${item.name} marked as ${
          item.available ? "Unavailable" : "Available"
        }`
      );

    } catch (err) {

      console.error(err);
      toast.error(formatApiError(err?.response?.data?.detail, "Failed to update item"));

    } finally {

      setUpdatingId(null);

    }

  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-500 font-medium">Loading menu...</p>
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
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Menu Management</h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <Utensils size={14} className="text-orange-500" /> Manage menu items and availability
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={fetchMenu}
              className="flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Refresh
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
        {/* STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Items</p>
                <p className="text-3xl font-black text-gray-900 mt-1">{menu.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                <Utensils size={24} />
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
                <p className="text-sm text-gray-500 font-medium">Available</p>
                <p className="text-3xl font-black text-gray-900 mt-1">
                  {menu.filter(m => m.available !== false).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 text-green-500 rounded-xl flex items-center justify-center">
                <CheckCircle2 size={24} />
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
                <p className="text-sm text-gray-500 font-medium">Unavailable</p>
                <p className="text-3xl font-black text-gray-900 mt-1">
                  {menu.filter(m => m.available === false).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center">
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
                <p className="text-sm text-gray-500 font-medium">Avg Price</p>
                <p className="text-3xl font-black text-gray-900 mt-1">
                  ₹{menu.length > 0 ? Math.round(menu.reduce((sum, m) => sum + (m.price || 0), 0) / menu.length) : 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center">
                <DollarSign size={24} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* EMPTY STATE */}
        {menu.length === 0 && (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
            <Utensils size={64} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No menu items found</h3>
            <p className="text-gray-500">Add menu items to get started</p>
          </div>
        )}

        {/* MENU GRID */}
        {menu.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {menu.map((item, index) => {
              const unavailable = item.available === false;
              const imageUrl = item.image
                ? item.image.startsWith("http")
                  ? item.image
                  : `${BASE_URL}/uploads/${item.image}`
                : null;

              return (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden transition-all hover:shadow-lg ${
                    unavailable ? "border-red-200" : "border-gray-100"
                  }`}
                >
                  {/* IMAGE */}
                  <div className="h-48 bg-gray-100 relative">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={item.name}
                        className={`h-full w-full object-cover ${
                          unavailable ? "grayscale opacity-60" : ""
                        }`}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400">
                        <Utensils size={48} />
                      </div>
                    )}
                    {unavailable && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold text-sm">
                          UNAVAILABLE
                        </span>
                      </div>
                    )}
                  </div>

                  {/* CONTENT */}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{item.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        unavailable ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                      }`}>
                        {unavailable ? "Unavailable" : "Available"}
                      </span>
                    </div>
                    
                    <p className="text-2xl font-bold text-orange-600 mb-4">₹{item.price}</p>
                    
                    {item.description && (
                      <p className="text-sm text-gray-500 mb-4 line-clamp-2">{item.description}</p>
                    )}

                    <button
                      disabled={updatingId === item._id}
                      onClick={() => toggleAvailability(item)}
                      className={`w-full px-4 py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                        unavailable
                          ? "bg-green-500 hover:bg-green-600"
                          : "bg-red-500 hover:bg-red-600"
                      } ${
                        updatingId === item._id
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      {updatingId === item._id ? (
                        <span className="flex items-center gap-2">
                          <RefreshCw size={16} className="animate-spin" />
                          Updating...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          {unavailable ? (
                            <>
                              <CheckCircle2 size={16} />
                              Mark Available
                            </>
                          ) : (
                            <>
                              <AlertCircle size={16} />
                              Mark Unavailable
                            </>
                          )}
                        </span>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

};

export default AdminMenuPage;
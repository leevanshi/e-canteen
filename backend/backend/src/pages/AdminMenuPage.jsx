import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import API, { toggleMenuAvailability } from "../api";
import { useAuth } from "../context/AuthContext";

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

      const res = await API.get("/menu");

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
      toast.error("Failed to load menu");

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

      await toggleMenuAvailability(item._id);

      setMenu((prev) =>
        prev.map((i) =>
          i._id === item._id
            ? { ...i, available: !i.available }
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
      toast.error("Failed to update item");

    } finally {

      setUpdatingId(null);

    }

  };

  if (authLoading || loading) {
    return (
      <p className="text-center mt-10 text-gray-500 animate-pulse">
        Loading menu...
      </p>
    );
  }

  return (

    <div className="p-6 max-w-7xl mx-auto">

      {/* TOP BAR */}

      <div className="flex items-center gap-4 mb-6">

        <button
          onClick={() => navigate(-1)}
          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
        >
          ← Back
        </button>

        <h1 className="text-2xl font-bold">
          Manage Menu
        </h1>

      </div>

      {menu.length === 0 && (
        <p className="text-gray-500">
          No menu items found.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">

        {menu.map((item) => {

          const unavailable = item.available === false;

          const imageUrl = item.image
            ? item.image.startsWith("http")
              ? item.image
              : `${BASE_URL}/uploads/${item.image}`
            : null;

          return (

            <div
              key={item._id}
              className={`bg-white rounded-xl shadow transition ${
                unavailable ? "border-2 border-red-500" : ""
              }`}
            >

              {/* IMAGE */}

              <div className="h-40 bg-gray-100 relative">

                {imageUrl ? (

                  <img
                    src={imageUrl}
                    alt={item.name}
                    className={`h-full w-full object-cover ${
                      unavailable ? "grayscale" : ""
                    }`}
                  />

                ) : (

                  <div className="h-full flex items-center justify-center text-gray-400">
                    No image
                  </div>

                )}

                {unavailable && (

                  <span className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                    UNAVAILABLE
                  </span>

                )}

              </div>

              {/* CONTENT */}

              <div className="p-4">

                <h2 className="font-semibold text-lg">
                  {item.name}
                </h2>

                <p className="text-gray-600">
                  ₹{item.price}
                </p>

                <p
                  className={`text-sm mt-1 font-medium ${
                    unavailable
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {unavailable ? "Unavailable" : "Available"}
                </p>

                <button
                  disabled={updatingId === item._id}
                  onClick={() => toggleAvailability(item)}
                  className={`mt-4 w-full px-3 py-2 rounded text-sm font-medium text-white transition ${
                    unavailable
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-red-500 hover:bg-red-600"
                  } ${
                    updatingId === item._id
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >

                  {unavailable
                    ? "Mark Available"
                    : "Mark Unavailable"}

                </button>

              </div>

            </div>

          );

        })}

      </div>

    </div>

  );

};

export default AdminMenuPage;
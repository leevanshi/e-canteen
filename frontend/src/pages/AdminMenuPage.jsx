// AdminMenuPage.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // ⭐ ADD
import API from "../api";
import { toast } from "sonner";

const AdminMenuPage = () => {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const navigate = useNavigate(); // ⭐ ADD

  /* ================= FETCH MENU ================= */
  const fetchMenu = async () => {
    try {
      const res = await API.get("/menu");
      setMenu(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load menu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  /* ================= TOGGLE AVAILABILITY ================= */
  const toggleAvailability = async (item) => {
    if (updatingId === item._id) return;

    setUpdatingId(item._id);

    try {
      await API.put(`/admin/menu/${item._id}/availability`, {

        available: !item.available,
      });

      setMenu((prev) =>
        prev.map((i) =>
          i._id === item._id
            ? { ...i, available: !item.available }
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

  if (loading) {
    return (
      <p className="text-center mt-10 text-gray-500">
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

          return (
            <div
              key={item._id}
              className={`bg-white rounded-xl shadow transition ${
                unavailable ? "border-2 border-red-500" : ""
              }`}
            >
              <div className="h-40 bg-gray-100 relative">
                {item.image ? (
                  <img
                    src={
                      item.image.startsWith("http")
                        ? item.image
                        : `http://127.0.0.1:8000/uploads/${item.image}`
                    }
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

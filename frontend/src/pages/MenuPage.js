import { useEffect, useMemo, useState } from "react";
import API from "../api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext"; // ✅ added

/* ================= PLACEHOLDER IMAGE ================= */

const fallbackImage =
  "https://images.unsplash.com/photo-1604908554165-3a7c22e0b9c6?q=80&w=600";

/* ================= COMPONENT ================= */

const MenuPage = () => {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const navigate = useNavigate();

  /* ✅ USE GLOBAL CART */
  const { cart, addToCart, decreaseQty } = useCart();

  /* ================= FETCH MENU ================= */

  const fetchMenu = async () => {
    try {
      const res = await API.get("/menu");
      const data = Array.isArray(res.data) ? res.data : [];
      setMenu(data);
    } catch {
      toast.error("Failed to load menu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  /* ================= CATEGORIES ================= */

  const categories = useMemo(() => {
    const unique = [...new Set(menu.map((m) => m.category))];
    return ["all", ...unique];
  }, [menu]);

  /* ================= FILTERED MENU ================= */

  const filteredMenu = useMemo(() => {
    return menu.filter((item) => {
      const matchSearch = item.name
        ?.toLowerCase()
        .includes(search.toLowerCase());

      const matchCategory =
        category === "all" || item.category === category;

      return matchSearch && matchCategory;
    });
  }, [menu, search, category]);

  /* ================= TOTAL ================= */

  const totalItems = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const totalPrice = cart.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  /* ================= DAILY SPECIAL ================= */

  const special = menu[0];

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <p className="text-center mt-10 text-gray-500 animate-pulse">
        Loading menu...
      </p>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">

      {/* HEADER */}

      <h1 className="text-2xl font-bold mb-6">
        Today's Menu
      </h1>

      {/* DAILY SPECIAL */}

      {special && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-xl mb-6">
          ⭐ <strong>Today's Special:</strong> {special.name} – ₹{special.price}
        </div>
      )}

      {/* SEARCH */}

      <input
        type="text"
        placeholder="Search food..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border rounded p-2 mb-4"
      />

      {/* CATEGORY FILTER */}

      <div className="flex gap-2 flex-wrap mb-6">

        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-3 py-1 rounded border capitalize ${
              category === c
                ? "bg-black text-white"
                : "hover:bg-gray-100"
            }`}
          >
            {c}
          </button>
        ))}

      </div>

      {/* MENU GRID */}

      <div className="grid md:grid-cols-3 gap-6">

        {filteredMenu.map((item) => {

          /* ✅ CHECK CART FROM CONTEXT */
          const cartItem = cart.find((c) => c._id === item._id);
          const quantity = cartItem?.quantity || 0;

          return (
            <div
              key={item._id}
              className="bg-white rounded-xl shadow border overflow-hidden"
            >

              {/* IMAGE */}

              <img
                src={item.image || fallbackImage}
                alt={item.name}
                className="w-full h-40 object-cover"
              />

              <div className="p-4">

                <h2 className="font-semibold text-lg">
                  {item.name}
                </h2>

                <p className="text-gray-500 text-sm mt-1">
                  {item.description}
                </p>

                <p className="font-bold mt-2">
                  ₹{item.price}
                </p>

                {/* ACTIONS */}

                {quantity === 0 ? (
                  <button
                    onClick={() => {
                      addToCart(item);
                      toast.success(`${item.name} added`);
                    }}
                    className="mt-3 w-full bg-black text-white py-2 rounded"
                  >
                    Add
                  </button>
                ) : (
                  <div className="flex justify-between items-center mt-3">

                    <button
                      onClick={() => decreaseQty(item._id)}
                      className="px-3 py-1 border rounded"
                    >
                      -
                    </button>

                    <span>{quantity}</span>

                    <button
                      onClick={() => {
                        addToCart(item);
                        toast.success(`${item.name} added`);
                      }}
                      className="px-3 py-1 border rounded"
                    >
                      +
                    </button>

                  </div>
                )}

              </div>
            </div>
          );
        })}
      </div>

      {/* STICKY CART BAR */}

      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-black text-white p-4 flex justify-between items-center">

          <div>
            {totalItems} items • ₹{totalPrice}
          </div>

          <button
            onClick={() => navigate("/cart")}
            className="bg-white text-black px-4 py-2 rounded"
          >
            View Cart
          </button>

        </div>
      )}

    </div>
  );
};

export default MenuPage;
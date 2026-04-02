import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import API from "../api";
import { useCart } from "../context/CartContext";

const fallbackImage =
  "https://images.unsplash.com/photo-1604908554165-3a7c22e0b9c6?q=80&w=600";

const MenuPage = () => {

  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const navigate = useNavigate();

  const { cart, addToCart, decreaseQty } = useCart();

  /* ================= FETCH MENU ================= */

  useEffect(() => {

    let active = true;

    const fetchMenu = async () => {

      try {

        const res = await API.get("/menu");

        const data = Array.isArray(res.data) ? res.data : [];

        const normalized = data.map((item) => ({
          ...item,
          _id: item._id || item.id
        }));

        if (active) {
          setMenu(normalized);
        }

      } catch {

        toast.error("Failed to load menu");

      } finally {

        if (active) {
          setLoading(false);
        }

      }

    };

    fetchMenu();

    return () => {
      active = false;
    };

  }, []);

  /* ================= CART MAP (FAST LOOKUP) ================= */

  const cartMap = useMemo(() => {

    const map = {};

    for (const item of cart) {
      map[item._id] = item;
    }

    return map;

  }, [cart]);

  /* ================= FILTER ================= */

  const categories = useMemo(() => {

    const unique = [
      ...new Set(
        menu
          .map((m) => m.category)
          .filter(Boolean)
      )
    ];

    return ["all", ...unique];

  }, [menu]);

  const filteredMenu = useMemo(() => {

    const searchTerm = search.trim().toLowerCase();

    return menu.filter((item) => {

      const matchSearch =
        !searchTerm ||
        item.name?.toLowerCase().includes(searchTerm);

      const matchCategory =
        category === "all" || item.category === category;

      return matchSearch && matchCategory;

    });

  }, [menu, search, category]);

  /* ================= TOTAL ================= */

  const totalItems = useMemo(() => {

    return cart.reduce(
      (sum, i) => sum + (i.quantity || 1),
      0
    );

  }, [cart]);

  const totalPrice = useMemo(() => {

    return cart.reduce(
      (sum, i) =>
        sum + (i.quantity || 1) * (i.price || 0),
      0
    );

  }, [cart]);

  if (loading) {
    return (
      <p className="text-center mt-10 text-gray-500">
        Loading menu...
      </p>
    );
  }

  return (

    <div className="max-w-6xl mx-auto px-4 py-5 pb-24">

      <h1 className="text-xl md:text-2xl font-bold mb-5">
        Today's Menu
      </h1>

      {/* SEARCH */}

      <input
        type="text"
        placeholder="Search food..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border rounded-lg p-3 mb-4 text-sm"
      />

      {/* CATEGORY */}

      <div className="flex gap-2 overflow-x-auto pb-2 mb-5">

        {categories.map((c) => (

          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-4 py-2 rounded-full border whitespace-nowrap capitalize text-sm ${
              category === c
                ? "bg-black text-white"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            {c}
          </button>

        ))}

      </div>

      {/* MENU GRID */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

        {filteredMenu.map((item) => {

          const id = item._id;

          const cartItem = cartMap[id];

          const quantity = cartItem?.quantity || 0;

          return (

            <div
              key={id}
              className="bg-white rounded-xl shadow border overflow-hidden"
            >

              <img
                src={item.image || fallbackImage}
                alt={item.name}
                onError={(e) => (e.currentTarget.src = fallbackImage)}
                className="w-full h-44 object-cover"
              />

              <div className="p-4">

                <h2 className="font-semibold text-base md:text-lg">
                  {item.name}
                </h2>

                <p className="text-gray-500 text-sm mt-1">
                  {item.description}
                </p>

                <p className="font-bold mt-2 text-lg">
                  ₹{Number(item.price).toFixed(0)}
                </p>

                {quantity === 0 ? (

                  <button
                    onClick={() => {
                      addToCart(item);
                      toast.success(`${item.name} added`);
                    }}
                    className="mt-3 w-full bg-black text-white py-2.5 rounded-lg text-sm"
                  >
                    Add to Cart
                  </button>

                ) : (

                  <div className="flex justify-between items-center mt-3">

                    <button
                      onClick={() => decreaseQty(id)}
                      className="px-4 py-2 border rounded-lg text-lg"
                    >
                      -
                    </button>

                    <span className="font-medium">
                      {quantity}
                    </span>

                    <button
                      onClick={() => addToCart(item)}
                      className="px-4 py-2 border rounded-lg text-lg"
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

      {/* CART BAR */}

      {totalItems > 0 && (

        <div className="fixed bottom-0 left-0 right-0 bg-black text-white px-5 py-4 flex items-center justify-between shadow-lg">

          <div className="text-sm md:text-base">
            {totalItems} items • ₹{totalPrice}
          </div>

          <button
            onClick={() => navigate("/cart")}
            className="bg-white text-black px-5 py-2 rounded-lg font-medium"
          >
            View Cart
          </button>

        </div>

      )}

    </div>

  );

};

export default MenuPage;
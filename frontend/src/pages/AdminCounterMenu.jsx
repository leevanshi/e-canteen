import React, { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { placeCounterOrder } from "../api";
import API from "../api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";

/* ================= HELPERS ================= */

const formatCurrency = (num) =>
  `₹${Number(num || 0).toFixed(0)}`;

/* ================= COMPONENT ================= */

const AdminCounterMenu = () => {

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const role = (user?.role || "").toLowerCase();

  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [showBill, setShowBill] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

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

  useEffect(() => {

    if (!authLoading && role === "admin") {
      fetchMenu();
    }

  }, [authLoading, role]);

  const fetchMenu = async () => {

    try {

      const res = await API.get("/menu");

      const data = Array.isArray(res?.data)
        ? res.data
        : res?.data?.menu || [];

      const safeMenu = data.map((item, idx) => ({
        ...item,
        _id: item._id || item.id || `item-${idx}`,
        price: Number(item.price || 0)
      }));

      setMenu(safeMenu);

    } catch (err) {

      console.error(err);
      toast.error("Failed to load menu");

    }

  };

  /* ================= ADD ITEM ================= */

  const addItem = (item) => {

    setCart((prev) => {

      const exists = prev.find((i) => i._id === item._id);

      if (exists) {
        return prev.map((i) =>
          i._id === item._id
            ? { ...i, qty: i.qty + 1 }
            : i
        );
      }

      return [...prev, { ...item, qty: 1 }];

    });

  };

  /* ================= REMOVE ITEM ================= */

  const removeItem = (id) => {

    setCart((prev) =>
      prev
        .map((i) =>
          i._id === id
            ? { ...i, qty: i.qty - 1 }
            : i
        )
        .filter((i) => i.qty > 0)
    );

  };

  /* ================= FILTER MENU ================= */

  const filteredMenu = useMemo(() => {

    return menu.filter((i) =>
      i.name?.toLowerCase().includes(search.toLowerCase())
    );

  }, [menu, search]);

  /* ================= TOTAL ================= */

  const totalAmount = useMemo(() => {

    return cart.reduce(
      (sum, i) => sum + i.price * i.qty,
      0
    );

  }, [cart]);

  /* ================= PLACE ORDER ================= */

  const placeOrder = async () => {

    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    setLoading(true);

    try {

      const res = await placeCounterOrder({
        items: cart.map((i) => ({
          item_id: i._id,
          name: i.name,
          price: i.price,
          quantity: i.qty
        })),
        total_amount: totalAmount,
        payment_method: "counter"
      });

      const orderId =
        res?.data?.order_id ||
        res?.data?.order_number ||
        "—";

      setOrderNumber(orderId);
      setShowBill(true);

      toast.success("Order placed successfully");

    } catch (err) {

      console.error("ORDER ERROR 👉", err?.response?.data);
      toast.error("Order failed");

    } finally {

      setLoading(false);

    }

  };

  if (authLoading) {
    return (
      <div className="p-10 text-center">
        Loading...
      </div>
    );
  }

  return (

    <div className="p-6 max-w-7xl mx-auto">

      {/* HEADER */}

      <div className="flex items-center gap-3 mb-6">

        <Button
          variant="outline"
          onClick={() => navigate(-1)}
        >
          ← Back
        </Button>

        <h1 className="text-2xl font-bold">
          🧾 Counter Order
        </h1>

      </div>

      <div className="grid md:grid-cols-3 gap-6">

        {/* MENU */}

        <div className="md:col-span-2">

          <input
            type="text"
            placeholder="Search menu item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full mb-4 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-400"
          />

          <div className="grid sm:grid-cols-2 gap-4">

            {filteredMenu.map((item) => (

              <div
                key={item._id}
                className="border rounded-xl p-4 flex justify-between items-center hover:shadow transition"
              >

                <div>
                  <h3 className="font-semibold">
                    {item.name}
                  </h3>
                  <p>{formatCurrency(item.price)}</p>
                </div>

                <button
                  onClick={() => addItem(item)}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                >
                  +
                </button>

              </div>

            ))}

          </div>

        </div>

        {/* CHECKOUT */}

        <div className="border rounded-xl p-4 shadow-sm bg-white">

          <h2 className="text-xl font-semibold mb-3">
            Checkout
          </h2>

          {cart.length === 0 ? (

            <p className="text-gray-500">
              Cart is empty
            </p>

          ) : (

            <>

              {cart.map((item) => (

                <div
                  key={item._id}
                  className="flex justify-between items-center mb-2"
                >

                  <span>{item.name}</span>

                  <div className="flex items-center gap-2">

                    <button
                      onClick={() => removeItem(item._id)}
                      className="px-2 bg-gray-200 rounded"
                    >
                      −
                    </button>

                    <span>{item.qty}</span>

                    <button
                      onClick={() => addItem(item)}
                      className="px-2 bg-gray-200 rounded"
                    >
                      +
                    </button>

                  </div>
{showBill && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl p-6 w-[350px] shadow-lg">

      <h2 className="text-xl font-bold text-center mb-2">
        Canteen Receipt
      </h2>

      <p className="text-sm text-center mb-4">
        Order #{orderNumber}
      </p>

      <div className="border-t border-b py-2 mb-3">

        {cart.map((item) => (

          <div
            key={item._id}
            className="flex justify-between text-sm mb-1"
          >
            <span>
              {item.name} x{item.qty}
            </span>

            <span>
              ₹{item.price * item.qty}
            </span>

          </div>

        ))}

      </div>

      <div className="flex justify-between font-bold mb-4">
        <span>Total</span>
        <span>₹{totalAmount}</span>
      </div>

      <div className="flex gap-2">

        <button
          onClick={() => window.print()}
          className="flex-1 bg-green-600 text-white py-2 rounded"
        >
          Print
        </button>

        <button
          onClick={() => {
            setShowBill(false);
            setCart([]);
          }}
          className="flex-1 bg-gray-200 py-2 rounded"
        >
          Close
        </button>

      </div>

    </div>
  </div>
)}
                </div>

              ))}

              <hr />

              <p className="font-bold my-2">
                Total: {formatCurrency(totalAmount)}
              </p>

              <button
                onClick={placeOrder}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white w-full py-2 rounded"
              >
                {loading
                  ? "Placing..."
                  : "Place Order & Generate Bill"}
              </button>

            </>

          )}

        </div>

      </div>

    </div>

  );

};

export default AdminCounterMenu;
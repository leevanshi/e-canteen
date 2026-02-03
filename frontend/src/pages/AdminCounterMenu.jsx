import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import API from "../api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";

const AdminCounterMenu = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [showBill, setShowBill] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  /* 🔐 FETCH MENU */
  useEffect(() => {
    if (!authLoading && user) {
      fetchMenu();
    }
  }, [authLoading, user]);

  const fetchMenu = async () => {
    try {
      const res = await API.get("/menu");
      setMenu(res.data || []);
    } catch {
      toast.error("Failed to load menu");
    }
  };

  /* ➕ ADD ITEM */
  const addItem = (item) => {
    setCart((prev) => {
      const exists = prev.find((i) => i._id === item._id);
      if (exists) {
        return prev.map((i) =>
          i._id === item._id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  /* ➖ REMOVE ITEM */
  const removeItem = (id) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i._id === id ? { ...i, qty: i.qty - 1 } : i
        )
        .filter((i) => i.qty > 0)
    );
  };

  /* 💰 TOTAL */
  const totalAmount = cart.reduce(
    (sum, i) => sum + i.price * i.qty,
    0
  );

  /* 🧾 PLACE ORDER */
  const placeOrder = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    setLoading(true);

    try {
const res = await API.post("/admin/place-order", {
  items: cart.map((i) => ({
    item_id: i._id,
    name: i.name,
    price: i.price,
    quantity: i.qty,
  })),
  total_amount: totalAmount,
});


      setOrderNumber(res.data.order_id);
      setShowBill(true);
      toast.success("Order placed successfully");
    } catch (err) {
      console.error("ORDER ERROR 👉", err.response?.data);
      toast.error("Order failed");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  return (
    <div className="p-6">

      {/* HEADER */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          ← Back
        </Button>
        <h1 className="text-2xl font-bold">🧾 Counter Order</h1>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* MENU */}
        <div className="col-span-2">
          <input
            type="text"
            placeholder="Search menu item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full mb-4 px-3 py-2 border rounded"
          />

          <div className="grid grid-cols-2 gap-4">
            {menu
              .filter((i) =>
                i.name.toLowerCase().includes(search.toLowerCase())
              )
              .map((item) => (
                <div
                  key={item._id}
                  className="border rounded p-4 flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p>₹{item.price}</p>
                  </div>
                  <button
                    onClick={() => addItem(item)}
                    className="bg-green-600 text-white px-3 py-1 rounded"
                  >
                    +
                  </button>
                </div>
              ))}
          </div>
        </div>

        {/* CHECKOUT */}
        <div className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-3">Checkout</h2>

          {cart.length === 0 ? (
            <p className="text-gray-500">Cart is empty</p>
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
                </div>
              ))}

              <hr />
              <p className="font-bold my-2">Total: ₹{totalAmount}</p>

              <button
                onClick={placeOrder}
                disabled={loading}
                className="bg-green-600 text-white w-full py-2 rounded"
              >
                {loading ? "Placing..." : "Place Order & Generate Bill"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* BILL MODAL */}
      {showBill && (
<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
  <div className="relative bg-white w-[340px] rounded shadow-lg p-4 text-xs font-mono">
    
    <button
      onClick={() => {
        setShowBill(false);
        setCart([]);
      }}
      className="absolute top-2 right-2 text-lg font-bold"
    >
      ×
    </button>

    {/* HEADER */}
    <h2 className="text-center font-bold text-sm">E-CANTEEN</h2>
    <p className="text-center">NMIMS Chandigarh</p>
    <p className="text-center text-[10px]">
      Order ID: <strong>{orderNumber}</strong>
    </p>

    <hr className="my-2" />

    {/* DATE TIME */}
    <div className="flex justify-between text-[10px]">
      <span>Date:</span>
      <span>{new Date().toLocaleDateString()}</span>
    </div>
    <div className="flex justify-between text-[10px]">
      <span>Time:</span>
      <span>{new Date().toLocaleTimeString()}</span>
    </div>

    <hr className="my-2" />

    {/* TABLE HEADER */}
    <div className="flex justify-between font-bold text-[11px]">
      <span>Item</span>
      <span>Qty</span>
      <span>Rate</span>
      <span>Amt</span>
    </div>

    <hr className="my-1" />

    {/* ITEMS */}
    {cart.map((item) => (
      <div key={item._id} className="flex justify-between text-[11px]">
        <span className="w-[40%]">{item.name}</span>
        <span>{item.qty}</span>
        <span>₹{item.price}</span>
        <span>₹{item.price * item.qty}</span>
      </div>
    ))}

    <hr className="my-2" />

    {/* TOTAL */}
    <div className="flex justify-between font-bold text-sm">
      <span>Total</span>
      <span>₹{totalAmount}</span>
    </div>

    <p className="text-center text-[10px] mt-2">
      Payment Mode: AT COUNTER
    </p>

    <p className="text-center text-[10px] mt-1">
      Thank You! Visit Again 🙏
    </p>

    <button
      onClick={() => window.print()}
      className="w-full bg-green-600 text-white py-2 rounded mt-3"
    >
      Print
    </button>
  </div>
</div>

      )}
    </div>
  );
};

export default AdminCounterMenu;

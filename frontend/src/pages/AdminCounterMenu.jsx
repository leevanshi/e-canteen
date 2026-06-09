import React, { useEffect, useState, useMemo, useRef } from "react";
import { toast } from "sonner";
import { placeCounterOrder } from "../api";
import API from "../api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { formatApiError } from "../utils/formatApiError";
import { Search, Plus, Minus, Printer, Store } from "lucide-react";

const formatCurrency = (num) => `₹${Number(num || 0).toFixed(0)}`;

const formatIST = (date) => {
  try {
    return new Date(date).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return new Date().toLocaleString("en-IN");
  }
};

const AdminCounterMenu = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const printRef = useRef(null);

  const role = (user?.role || "").toLowerCase();
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [lastOrder, setLastOrder] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) navigate("/login", { replace: true });
    else if (role !== "admin") navigate("/menu", { replace: true });
  }, [authLoading, user, role, navigate]);

  useEffect(() => {
    if (!authLoading && role === "admin") fetchMenu();
  }, [authLoading, role]);

  const fetchMenu = async () => {
    try {
      const res = await API.get("/menu");
      const data = Array.isArray(res?.data) ? res.data : [];
      setMenu(data.map((item, idx) => ({
        ...item,
        _id: item._id || item.id || `item-${idx}`,
        price: Number(item.price || 0),
      })));
    } catch (err) {
      toast.error(formatApiError(err?.response?.data?.detail, "Failed to load menu"));
    }
  };

  const addItem = (item) => {
    setCart((prev) => {
      const exists = prev.find((i) => i._id === item._id);
      if (exists) {
        return prev.map((i) => i._id === item._id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const changeQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((i) => (i._id === id ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    );
  };

  const filteredMenu = useMemo(() =>
    menu.filter((i) => i.name?.toLowerCase().includes(search.toLowerCase())),
  [menu, search]);

  const totalAmount = useMemo(() =>
    cart.reduce((sum, i) => sum + i.price * i.qty, 0),
  [cart]);

  const placeOrder = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    setLoading(true);
    try {
      const res = await placeCounterOrder({
        items: cart.map((i) => ({
          name: i.name,
          price: i.price,
          quantity: i.qty,
        })),
        total_amount: totalAmount,
      });

      const order = res?.data?.order || {};
      const orderCode = res?.data?.order_code || order.order_code || "—";

      setLastOrder({
        order_code: orderCode,
        items: cart.map((i) => ({ name: i.name, quantity: i.qty, price: i.price })),
        total_amount: totalAmount,
        created_at: new Date().toISOString(),
        order_type: "walk-in",
        payment_method: "cash",
      });
      setShowReceipt(true);
      setCart([]);
      toast.success(`Walk-in order ${orderCode} created`);
    } catch (err) {
      toast.error(formatApiError(err?.response?.data?.detail, "Order failed"));
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (authLoading) {
    return <div className="p-10 text-center text-gray-500">Loading...</div>;
  }

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #walkin-receipt, #walkin-receipt * { visibility: visible; }
          #walkin-receipt {
            position: absolute; left: 0; top: 0; width: 80mm;
            font-family: monospace; font-size: 12px; padding: 8px;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="outline" onClick={() => navigate(-1)}>← Back</Button>
          <Store className="text-indigo-600" size={24} />
          <h1 className="text-2xl font-bold">Walk-In Orders</h1>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search menu items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto">
              {filteredMenu.map((item) => (
                <div key={item._id} className="border rounded-xl p-4 flex justify-between items-center hover:shadow-sm bg-white">
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-gray-600">{formatCurrency(item.price)}</p>
                  </div>
                  <button onClick={() => addItem(item)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg">
                    <Plus size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="border rounded-xl p-4 shadow-sm bg-white h-fit sticky top-6">
            <h2 className="text-xl font-semibold mb-3">Cart</h2>
            {cart.length === 0 ? (
              <p className="text-gray-500 text-sm">Add items from the menu</p>
            ) : (
              <>
                {cart.map((item) => (
                  <div key={item._id} className="flex justify-between items-center mb-3 text-sm">
                    <span className="flex-1 pr-2">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => changeQty(item._id, -1)} className="p-1 bg-gray-100 rounded"><Minus size={14}/></button>
                      <span className="w-5 text-center font-bold">{item.qty}</span>
                      <button onClick={() => changeQty(item._id, 1)} className="p-1 bg-gray-100 rounded"><Plus size={14}/></button>
                    </div>
                    <span className="w-16 text-right font-medium">{formatCurrency(item.price * item.qty)}</span>
                  </div>
                ))}
                <hr className="my-3" />
                <p className="font-bold text-lg mb-4">Total: {formatCurrency(totalAmount)}</p>
                <button onClick={placeOrder} disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white py-3 rounded-xl font-bold">
                  {loading ? "Placing..." : "Confirm Cash Order"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showReceipt && lastOrder && (
        <div className="no-print fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div id="walkin-receipt" ref={printRef} className="text-center font-mono text-sm space-y-2 mb-6">
              <h2 className="text-lg font-bold">E-CANTEEN</h2>
              <hr />
              <p>Order ID: <strong>{lastOrder.order_code}</strong></p>
              <p>{formatIST(lastOrder.created_at)}</p>
              <p>Order Type: Walk-In</p>
              <p>Payment: Cash</p>
              <hr />
              <div className="text-left space-y-1">
                {lastOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{item.name} x{item.quantity}</span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              <hr />
              <p className="font-bold text-base">Total: ₹{lastOrder.total_amount}</p>
              <p className="pt-2">Thank You</p>
            </div>
            <div className="flex gap-3">
              <button onClick={handlePrint}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 rounded-xl font-semibold">
                <Printer size={18} /> Print Slip
              </button>
              <button onClick={() => setShowReceipt(false)}
                className="flex-1 bg-gray-100 py-2.5 rounded-xl font-semibold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminCounterMenu;

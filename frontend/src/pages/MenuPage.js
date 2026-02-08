console.log("✅ MenuPage LOADED - FIXED FILE");

import { useEffect, useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";

import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

import { getMenu, getMyWallet } from "../api";

const BACKEND_URL = "https://e-canteen-7.onrender.com";

const MenuPage = () => {
  const [menu, setMenu] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const { token } = useAuth();
  const { addToCart, increaseQty, decreaseQty, getQuantity } = useCart();

  /* ================= 🍽️ FETCH MENU ================= */
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await getMenu();

        console.log("MENU RESPONSE 👉", res.data);

        let items = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.menu)
          ? res.data.menu
          : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

        items = items.map((item, index) => ({
          ...item,
          _id: item._id || item.id || index.toString(),
        }));

        setMenu(items);
      } catch (err) {
        console.error("Menu error ❌", err);
        setError("Menu load nahi hua");
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  /* ================= 💰 FETCH WALLET ================= */
  useEffect(() => {
    if (!token) return;

    const fetchWallet = async () => {
      try {
        const res = await getMyWallet();
        setWalletBalance(res.data?.balance ?? 0);
      } catch (err) {
        console.error("Wallet error ❌", err);
        setWalletBalance(0);
      }
    };

    fetchWallet();
  }, [token]);

  /* ================= 🔍 FILTER ================= */
  const filteredMenu = menu.filter((item) =>
    item.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  if (error) {
    return <div className="p-10 text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Menu</h1>

        <Card>
          <CardContent className="px-4 py-2">
            <p className="text-sm text-gray-500">Wallet Balance</p>
            <p className="text-lg font-bold text-green-600">
              ₹{walletBalance}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 🔍 SEARCH BAR */}
      <div className="mb-8">
        <input
          type="text"
          placeholder="Search food..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-96 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>

      {/* MENU GRID */}
      {filteredMenu.length === 0 ? (
        <p className="text-center text-gray-500">No items found</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredMenu.map((item) => {
            const id = String(item._id);
            const qty = getQuantity(id);
            const unavailable = item.available === false;

            return (
              <Card
                key={id}
                className={`transition ${
                  unavailable ? "border-2 border-red-500 opacity-80" : ""
                }`}
              >
                <CardContent className="p-4 flex flex-col gap-3">
                  <img
                    src={
                      item.image
                        ? item.image.startsWith("http")
                          ? item.image
                          : `${BACKEND_URL}/uploads/${item.image}`
                        : "/placeholder.png"
                    }
                    alt={item.name}
                    className={`h-40 w-full object-cover rounded ${
                      unavailable ? "grayscale" : ""
                    }`}
                  />

                  <h2 className="text-lg font-semibold">{item.name}</h2>
                  <p className="font-bold">₹{item.price}</p>

                  {unavailable ? (
                    <Button disabled>Unavailable</Button>
                  ) : qty === 0 ? (
                    <Button
                      onClick={() =>
                        addToCart({
                          _id: id,
                          name: item.name,
                          price: item.price,
                          image: item.image,
                        })
                      }
                    >
                      Add to Cart
                    </Button>
                  ) : (
                    <div className="flex justify-between items-center">
                      <Button onClick={() => decreaseQty(id)}>−</Button>
                      <span className="font-semibold">{qty}</span>
                      <Button onClick={() => increaseQty(id)}>+</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MenuPage;

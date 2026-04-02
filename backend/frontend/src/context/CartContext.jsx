import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback
} from "react";

const CartContext = createContext(null);

const MAX_QTY = 20;

/* ================= SAFE ITEM ================= */

const sanitizeItem = (item) => {

  if (!item) return null;

  const id = item._id || item.id;

  if (!id) return null;

  return {
    _id: id,
    name: item.name || "",
    price: Number(item.price) || 0,
    image: item.image || null,
    quantity: Math.max(1, Math.min(item.quantity || 1, MAX_QTY))
  };
};

export const CartProvider = ({ children }) => {

  const [cart, setCart] = useState(() => {

    try {

      const saved = localStorage.getItem("cart");

      if (!saved) return [];

      const parsed = JSON.parse(saved);

      if (!Array.isArray(parsed)) return [];

      return parsed.map(sanitizeItem).filter(Boolean);

    } catch {
      return [];
    }

  });

  /* ================= SAVE CART ================= */

  useEffect(() => {

    try {
      localStorage.setItem("cart", JSON.stringify(cart));
    } catch (err) {
      console.error("Cart save failed:", err);
    }

  }, [cart]);

  /* ================= ADD ITEM ================= */

  const addToCart = useCallback((item) => {

    const clean = sanitizeItem(item);

    if (!clean) return;

    setCart((prev) => {

      const existing = prev.find((i) => i._id === clean._id);

      if (existing) {

        return prev.map((i) =>
          i._id === clean._id
            ? {
                ...i,
                quantity: Math.min(
                  (i.quantity || 1) + 1,
                  MAX_QTY
                )
              }
            : i
        );

      }

      return [...prev, clean];

    });

  }, []);

  /* ================= INCREASE ================= */

  const increaseQty = useCallback((id) => {

    if (!id) return;

    setCart((prev) =>
      prev.map((item) =>
        item._id === id
          ? {
              ...item,
              quantity: Math.min(
                (item.quantity || 1) + 1,
                MAX_QTY
              )
            }
          : item
      )
    );

  }, []);

  /* ================= DECREASE ================= */

  const decreaseQty = useCallback((id) => {

    if (!id) return;

    setCart((prev) =>
      prev
        .map((item) =>
          item._id === id
            ? { ...item, quantity: (item.quantity || 1) - 1 }
            : item
        )
        .filter((item) => (item.quantity || 0) > 0)
    );

  }, []);

  /* ================= REMOVE ================= */

  const removeFromCart = useCallback((id) => {

    if (!id) return;

    setCart((prev) =>
      prev.filter((item) => item._id !== id)
    );

  }, []);

  /* ================= CLEAR ================= */

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  /* ================= DERIVED VALUES ================= */

  const cartCount = useMemo(() => {

    return cart.reduce(
      (sum, item) => sum + (item.quantity || 1),
      0
    );

  }, [cart]);

  const totalPrice = useMemo(() => {

    return cart.reduce(
      (sum, item) =>
        sum + (item.price || 0) * (item.quantity || 1),
      0
    );

  }, [cart]);

  /* ================= CONTEXT ================= */

  const value = useMemo(() => ({
    cart,
    cartCount,
    totalPrice,
    addToCart,
    increaseQty,
    decreaseQty,
    removeFromCart,
    clearCart
  }), [
    cart,
    cartCount,
    totalPrice,
    addToCart,
    increaseQty,
    decreaseQty,
    removeFromCart,
    clearCart
  ]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {

  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
};
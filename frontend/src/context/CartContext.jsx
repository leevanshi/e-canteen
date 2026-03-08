import { createContext, useContext, useEffect, useState, useMemo } from "react";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {

  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("cart");
      return saved ? JSON.parse(saved) : [];
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

  const addToCart = (item) => {

    if (!item) return;

    const id = item._id || item.id;

    if (!id) return;

    setCart((prev) => {

      const existing = prev.find((i) => i._id === id);

      if (existing) {

        return prev.map((i) =>
          i._id === id
            ? { ...i, quantity: (i.quantity || 1) + 1 }
            : i
        );

      }

      return [
        ...prev,
        {
          ...item,
          _id: id,
          quantity: 1
        }
      ];

    });

  };

  /* ================= INCREASE ================= */

  const increaseQty = (id) => {

    if (!id) return;

    setCart((prev) =>
      prev.map((item) =>
        item._id === id
          ? { ...item, quantity: (item.quantity || 1) + 1 }
          : item
      )
    );

  };

  /* ================= DECREASE ================= */

  const decreaseQty = (id) => {

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

  };

  /* ================= REMOVE ================= */

  const removeFromCart = (id) => {

    if (!id) return;

    setCart((prev) =>
      prev.filter((item) => item._id !== id)
    );

  };

  /* ================= CLEAR ================= */

  const clearCart = () => {
    setCart([]);
  };

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

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        totalPrice,
        addToCart,
        increaseQty,
        decreaseQty,
        removeFromCart,
        clearCart
      }}
    >
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
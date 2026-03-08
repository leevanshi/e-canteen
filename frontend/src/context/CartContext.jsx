import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

/* ================= PROVIDER ================= */
export const CartProvider = ({ children }) => {

  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });

  /* ================= SAVE CART ================= */
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  /* ================= ADD ITEM ================= */
  const addToCart = (item) => {
    const itemId = item._id || item.id;

    setCart((prev) => {
      const existingItem = prev.find((i) => i._id === itemId);

      if (existingItem) {
        return prev.map((i) =>
          i._id === itemId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }

      return [...prev, { ...item, _id: itemId, quantity: 1 }];
    });
  };

  /* ================= REMOVE ITEM ================= */
  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item._id !== id));
  };

  /* ================= INCREASE QTY ================= */
  const increaseQty = (id) => {
    setCart((prev) =>
      prev.map((item) =>
        item._id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  /* ================= DECREASE QTY ================= */
  const decreaseQty = (id) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item._id === id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  /* ================= CLEAR CART ================= */
  const clearCart = () => {
    setCart([]);
  };

  /* ================= TOTAL ================= */
  const totalPrice = cart.reduce(
    (total, item) => total + (item.price || 0) * (item.quantity || 1),
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        increaseQty,
        decreaseQty,
        clearCart,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

/* ================= HOOK ================= */
export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
};
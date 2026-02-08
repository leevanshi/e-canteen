import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const { isAuthenticated } = useAuth();

  /* =========================
     LOAD CART FROM STORAGE
  ========================= */
  useEffect(() => {
    if (!isAuthenticated) return;

    const stored = localStorage.getItem("cart");
    if (stored) {
      try {
        setCart(JSON.parse(stored));
      } catch {
        localStorage.removeItem("cart");
      }
    }
  }, [isAuthenticated]);

  /* =========================
     CLEAR CART ON LOGOUT
  ========================= */
  useEffect(() => {
    if (!isAuthenticated) {
      setCart([]);
      localStorage.removeItem("cart");
    }
  }, [isAuthenticated]);

  /* =========================
     PERSIST CART
  ========================= */
  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem("cart", JSON.stringify(cart));
    }
  }, [cart, isAuthenticated]);

  /* =========================
     ADD TO CART
  ========================= */
  const addToCart = (item) => {
    if (!isAuthenticated) {
      toast.error("Please login to add items");
      return;
    }

    if (!item?._id) {
      console.error("Item missing _id", item);
      return;
    }

    if (item.available === false) {
      toast.error("Item is currently unavailable");
      return;
    }

    setCart((prev) => {
      const existing = prev.find((i) => i._id === item._id);

      if (existing) {
        toast.success("Item quantity updated");
        return prev.map((i) =>
          i._id === item._id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }

      toast.success("Item added to cart");

      return [
        ...prev,
        {
          _id: item._id,
          name: item.name,
          price: item.price,
          image: item.image,
          quantity: 1,
        },
      ];
    });
  };

  /* =========================
     QUANTITY CONTROLS
  ========================= */
  const increaseQty = (_id) => {
    setCart((prev) =>
      prev.map((i) =>
        i._id === _id ? { ...i, quantity: i.quantity + 1 } : i
      )
    );
  };

  const decreaseQty = (_id) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i._id === _id
            ? { ...i, quantity: i.quantity - 1 }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  /* =========================
     REMOVE UNAVAILABLE ITEMS
  ========================= */
  const syncCartWithMenu = (menuItems) => {
    setCart((prev) =>
      prev.filter((cartItem) => {
        const menuItem = menuItems.find(
          (m) => m._id === cartItem._id
        );

        if (!menuItem || menuItem.available === false) {
          toast.error(
            `${cartItem.name} removed (unavailable)`
          );
          return false;
        }

        return true;
      })
    );
  };

  /* =========================
     HELPERS
  ========================= */
  const getQuantity = (_id) =>
    cart.find((i) => i._id === _id)?.quantity || 0;

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("cart");
  };

  /* =========================
     DERIVED VALUES
  ========================= */
  const cartCount = useMemo(
    () => cart.reduce((sum, i) => sum + i.quantity, 0),
    [cart]
  );

  const cartTotal = useMemo(
    () => cart.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [cart]
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        increaseQty,
        decreaseQty,
        getQuantity,
        clearCart,
        cartCount,
        cartTotal,
        syncCartWithMenu,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return ctx;
};

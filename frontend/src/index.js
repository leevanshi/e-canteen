import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { ThemeProvider } from "./context/ThemeContext";
import GlobalErrorBoundary from "./components/GlobalErrorBoundary";

import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <GlobalErrorBoundary>
    <AuthProvider>
      <CartProvider>
        <ThemeProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ThemeProvider>
      </CartProvider>
    </AuthProvider>
  </GlobalErrorBoundary>
);
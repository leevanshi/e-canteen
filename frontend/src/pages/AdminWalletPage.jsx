import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import API from "../api";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";

const AdminWalletPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [amounts, setAmounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [updatingUser, setUpdatingUser] = useState(null);

  /* ================= FETCH USERS ================= */
  const fetchUsers = async () => {
    if (!token) return;

    try {
      setLoading(true);

      const res = await API.get("/admin/users");

      const data = Array.isArray(res.data) ? res.data : [];
      setUsers(data);
    } catch (err) {
      console.error("User fetch error:", err);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  /* ================= FILTER USERS ================= */
  const filteredUsers = useMemo(() => {
    return users.filter((u) =>
      u.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search]);

  /* ================= ADD MONEY ================= */
  const addMoney = async (userId) => {
    const raw = amounts[userId];
    const amount = Number(raw);

    if (!amount || amount <= 0) {
      toast.error("Enter valid amount");
      return;
    }

    try {
      setUpdatingUser(userId);

      await API.post("/wallet/admin/add-money", {
        user_id: userId,
        amount,
      });

      toast.success("Money credited 💸");

      /* Optimistic UI update */
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId
            ? {
                ...u,
                wallet_balance:
                  Number(u.wallet_balance || 0) + amount,
              }
            : u
        )
      );

      setAmounts((prev) => ({
        ...prev,
        [userId]: "",
      }));
    } catch (err) {
      console.error("Add money error:", err);
      toast.error(
        err.response?.data?.detail || "Failed to add money"
      );
    } finally {
      setUpdatingUser(null);
    }
  };

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <p className="text-gray-500 animate-pulse">
          Loading users...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">

      {/* HEADER */}
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>
          ← Back
        </Button>

        <h1 className="text-3xl font-bold">
          Wallet Management
        </h1>
      </div>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Search by name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full sm:w-1/3 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
      />

      {/* EMPTY */}
      {filteredUsers.length === 0 && (
        <p className="text-gray-500">No users found</p>
      )}

      {/* USERS */}
      {filteredUsers.map((u) => (
        <Card key={u._id}>
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            {/* USER INFO */}
            <div>
              <p className="font-semibold">{u.name}</p>

              <p className="text-sm text-gray-500">
                {u.email}
              </p>

              <p className="text-green-600 font-bold">
                Balance: ₹{Number(u.wallet_balance || 0)}
              </p>

              {u.wallet_first_time && (
                <p className="text-xs text-orange-600">
                  ⚠ First-time wallet user
                </p>
              )}
            </div>

            {/* ADD MONEY */}
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                placeholder="Amount"
                className="border p-2 rounded w-32"
                value={amounts[u._id] || ""}
                onChange={(e) =>
                  setAmounts((prev) => ({
                    ...prev,
                    [u._id]: e.target.value,
                  }))
                }
              />

              <Button
                disabled={updatingUser === u._id}
                className="bg-green-600 hover:bg-green-700"
                onClick={() => addMoney(u._id)}
              >
                {updatingUser === u._id
                  ? "Adding..."
                  : "Add"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminWalletPage;
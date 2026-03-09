import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import { getUsers, adminAddMoney } from "../api";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";

const AdminWalletPage = () => {

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const role = (user?.role || "").toLowerCase();

  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [amounts, setAmounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [updatingUser, setUpdatingUser] = useState(null);

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

  /* ================= FETCH USERS ================= */

  const fetchUsers = async () => {

    try {

      setLoading(true);

      const res = await getUsers();

      const data =
        Array.isArray(res?.data)
          ? res.data
          : res?.data?.users || [];

      const safeUsers = data.map((u, idx) => ({

        _id: u._id || u.id || `user-${idx}`,
        name: u.name || "User",
        email: u.email || "—",
        wallet_balance: Number(u.wallet_balance) || 0,
        wallet_first_time: Boolean(u.wallet_first_time)

      }));

      setUsers(safeUsers);

    } catch (err) {

      console.error("User fetch error:", err);
      toast.error("Failed to load users");

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    if (!authLoading && role === "admin") {
      fetchUsers();
    }

  }, [authLoading, role]);

  /* ================= FILTER USERS ================= */

  const filteredUsers = useMemo(() => {

    const term = search.toLowerCase();

    return users.filter((u) =>
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term)
    );

  }, [users, search]);

  /* ================= ADD MONEY ================= */

  const addMoney = async (userId) => {

    const raw = amounts[userId];
    const amount = parseInt(raw, 10);

    if (!raw || isNaN(amount) || amount <= 0) {
      toast.error("Enter valid amount");
      return;
    }

    if (amount > 10000) {
      toast.error("Amount too large");
      return;
    }

    try {

      setUpdatingUser(userId);

      const res = await adminAddMoney({
        user_id: userId,
        amount
      });

      const newBalance =
        res?.data?.new_balance ??
        res?.data?.balance;

      toast.success(`₹${amount} added`);

      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId
            ? {
                ...u,
                wallet_balance: newBalance ?? u.wallet_balance
              }
            : u
        )
      );

      setAmounts((prev) => ({
        ...prev,
        [userId]: ""
      }));

    } catch (err) {

      console.error("Add money error:", err);

      toast.error(
        err?.response?.data?.detail ||
        "Failed to add money"
      );

    } finally {

      setUpdatingUser(null);

    }

  };

  /* ================= LOADING ================= */

  if (authLoading || loading) {

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

      <div className="flex items-center justify-between">

        <div className="flex items-center gap-3">

          <Button
            variant="outline"
            onClick={() => navigate(-1)}
          >
            ← Back
          </Button>

          <h1 className="text-3xl font-bold">
            Wallet Management
          </h1>

        </div>

        <Button
          variant="outline"
          onClick={() => navigate("/admin/wallet-history")}
        >
          Wallet History
        </Button>

      </div>

      {/* SEARCH */}

      <input
        type="text"
        placeholder="Search name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full sm:w-1/3 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
      />

      {filteredUsers.length === 0 && (
        <p className="text-gray-500">
          No users found
        </p>
      )}

      {/* USERS */}

      {filteredUsers.map((u) => (

        <Card key={u._id}>

          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            <div>

              <p className="font-semibold">
                {u.name}
              </p>

              <p className="text-sm text-gray-500">
                {u.email}
              </p>

              <p className="text-green-600 font-bold">
                Balance: ₹{u.wallet_balance}
              </p>

              {u.wallet_first_time && (

                <p className="text-xs text-orange-600">
                  ⚠ First-time wallet user
                </p>

              )}

            </div>

            <div className="flex gap-2">

              <input
                type="number"
                step="1"
                min="1"
                max="10000"
                placeholder="Amount"
                className="border p-2 rounded w-32"
                value={amounts[u._id] || ""}
                onChange={(e) =>
                  setAmounts((prev) => ({
                    ...prev,
                    [u._id]: e.target.value
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
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import API from "../api";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* ================= LOGIN HANDLER ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!email || !password) {
      toast.error("Please fill all fields");
      return;
    }

    setSubmitting(true);

    try {
      const res = await API.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      const token = res.data?.access_token;
      const userRes = res.data?.user;

      // ✅ ONLY HARD REQUIREMENT
      if (!token) {
        toast.error("Login failed");
        return;
      }

      login(
        {
          id: userRes?.id,
          email: userRes?.email,
          role: userRes?.role,
        },
        token
      );

      toast.success("Login successful");

      // ✅ FORCE NAVIGATION (no waiting for effect)
      if (userRes?.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/menu", { replace: true });
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.detail ||
          "Invalid email or password"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50">
      <Card className="w-full max-w-md rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Login</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600"
              disabled={submitting}
            >
              {submitting ? "Logging in..." : "Login"}
            </Button>

            <p className="text-center text-sm">
              <Link
                to="/forgot-password"
                className="text-orange-500 hover:underline"
              >
                Forgot Password?
              </Link>
            </p>

            <p className="text-center text-sm">
              Don’t have an account?{" "}
              <Link
                to="/join"
                className="text-orange-500 font-medium hover:underline"
              >
                Register now
              </Link>
            </p>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => navigate("/")}
              disabled={submitting}
            >
              Back to Home
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;

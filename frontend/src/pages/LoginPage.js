import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";

const API = "http://127.0.0.1:8000";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  /* SAFE REDIRECT AFTER LOGIN */
  useEffect(() => {
    if (!user || !user.role) return;

    if (user.role === "admin") {
      navigate("/admin/dashboard", { replace: true });
    } else {
      navigate("/menu", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!email || !password) {
      toast.error("Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        `${API}/auth/login`,
        {
          email: email.trim().toLowerCase(),
          password,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      const token =
        res.data.token ||
        res.data.access_token ||
        res.data.jwt;

      if (!token) throw new Error("Token missing");

      const rawRole =
        res.data.user?.role ||
        res.data.role ||
        "student";

      const userData = {
        id: res.data.user?.id || res.data.user_id,
        email: res.data.user?.email || res.data.email,
        role: rawRole.toLowerCase(),
      };

      login(userData, token);
      toast.success("Login successful");
    } catch (err) {
      toast.error(
        err?.response?.data?.detail ||
          err?.message ||
          "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50">
      <Card className="w-full max-w-md rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Login
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* EMAIL */}
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* PASSWORD */}
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* LOGIN BUTTON */}
            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>

            {/* FORGOT PASSWORD */}
            <p className="text-center text-sm">
              <Link
                to="/forgot-password"
                className="text-orange-500 hover:underline"
              >
                Forgot Password?
              </Link>
            </p>

            {/* REGISTER LINK 🔥 */}
            <p className="text-center text-sm">
              Don’t have an account?{" "}
              <Link
                to="/join"
                className="text-orange-500 font-medium hover:underline"
              >
                Register now
              </Link>
            </p>

            {/* BACK BUTTON */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => navigate("/")}
              disabled={loading}
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

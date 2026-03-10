import { useState } from "react";
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
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (submitting) return;

    if (!email.trim() || !password.trim()) {
      toast.error("Please fill all fields");
      return;
    }

    setSubmitting(true);

    const slowTimer = setTimeout(() => {
      toast.info("⏳ Server is waking up, please wait...");
    }, 4000);

    try {

      const response = await API.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password
      });

      clearTimeout(slowTimer);

      const data = response?.data;

      if (!data) {
        toast.error("Server returned empty response");
        return;
      }

      const token = data.access_token;
      const user = data.user;

      if (!token || !user) {
        toast.error("Invalid login response");
        return;
      }

      const role = (user.role || "").toLowerCase();

      login(
        {
          id: user.id || user._id,
          email: user.email,
          role
        },
        token
      );

      toast.success("Login successful");

      /* ROLE BASED REDIRECT */

      if (role === "admin") {

        navigate("/admin/dashboard", { replace: true });

      } else if (role === "faculty") {

        navigate("/faculty/dashboard", { replace: true });

      } else {

        navigate("/menu", { replace: true });

      }

    } catch (err) {

      clearTimeout(slowTimer);

      if (!err.response) {

        toast.error(
          "🚀 Server is starting... please wait 30–60 seconds and try again"
        );

      } else {

        const message =
          err.response?.data?.detail ||
          err.response?.data?.message ||
          "Invalid email or password";

        toast.error(message);

      }

    } finally {

      setSubmitting(false);

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

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div>
              <Label>Password</Label>

              <div className="relative">

                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2 text-sm text-gray-500"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>

              </div>

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
              Don't have an account?{" "}
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
import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { Coffee, Loader2 } from "lucide-react";

import { registerUser } from "../api";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { role } = useParams();
  const [loading, setLoading] = useState(false);

  /* ================= VALIDATE ROLE ================= */
  useEffect(() => {
    if (!["student", "staff", "admin"].includes(role)) {
      navigate("/join", { replace: true });
    }
  }, [role, navigate]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  /* ================= REGISTER ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const { name, email, password } = formData;

    if (!name || !email || !password) {
      toast.error("Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      await registerUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role, // student | staff | admin
      });

      toast.success("Account registered successfully. Please login.");
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("REGISTER ERROR:", err);

      if (err?.response?.status === 409) {
        toast.info("Account already exists. Please login.");
        navigate("/login", { replace: true });
      } else {
        toast.error(
          err?.response?.data?.detail ||
            err?.message ||
            "Registration failed"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const roleLabel =
    role?.charAt(0).toUpperCase() + role?.slice(1);

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50">
      <Card className="w-full max-w-md rounded-2xl shadow-lg">
        <CardHeader className="text-center">
          <Coffee className="mx-auto h-10 w-10 text-orange-500" />
          <CardTitle>Register as {roleLabel}</CardTitle>
          <CardDescription>Create your account</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                required
                value={formData.name}
                onChange={(e) =>
                  handleChange("name", e.target.value)
                }
                disabled={loading}
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  handleChange("email", e.target.value)
                }
                disabled={loading}
              />
            </div>

            <div>
              <Label>Password</Label>
              <Input
                type="password"
                required
                value={formData.password}
                onChange={(e) =>
                  handleChange("password", e.target.value)
                }
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                "Register"
              )}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-orange-500 font-semibold"
            >
              Login
            </Link>
          </p>

          <div className="mt-2 text-center">
            <Link to="/" className="text-xs text-muted-foreground">
              Back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;

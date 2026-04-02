import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { Coffee, Loader2, Eye, EyeOff } from "lucide-react";

import API from "../api";

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
  const [showPassword, setShowPassword] = useState(false);

  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    otp: ""
  });

  useEffect(() => {
    if (!["student", "faculty"].includes(role)) {
      navigate("/join", { replace: true });
    }
  }, [role, navigate]);

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // ================= SEND OTP =================

  const handleSendOtp = async () => {

    if (!formData.email) {
      toast.error("Enter email first");
      return;
    }

    setLoading(true);

    try {

      await API.post("/auth/send-otp", {
        email: formData.email.trim().toLowerCase()
      });

      toast.success("OTP sent to your email");
      setStep(2);

    } catch (err) {

      toast.error(
        err.response?.data?.detail || "Failed to send OTP"
      );

    } finally {
      setLoading(false);
    }
  };

  // ================= VERIFY OTP =================

  const handleVerifyOtp = async () => {

    if (!formData.otp) {
      toast.error("Enter OTP");
      return;
    }

    setLoading(true);

    try {

      await API.post("/auth/verify-otp", {
        email: formData.email.trim().toLowerCase(),
        otp: formData.otp
      });

      toast.success("OTP verified");

      setStep(3);

    } catch (err) {

      toast.error(
        err.response?.data?.detail || "Invalid OTP"
      );

    } finally {
      setLoading(false);
    }
  };

  // ================= REGISTER =================

  const handleRegister = async (e) => {

    e.preventDefault();

    const { name, email, password } = formData;

    if (!name || !email || !password) {
      toast.error("Please fill all fields");
      return;
    }

    setLoading(true);

    try {

      await API.post("/auth/register", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role
      });

      toast.success("Account created successfully");

      navigate("/login", { replace: true });

    } catch (err) {

      toast.error(
        err.response?.data?.detail || "Registration failed"
      );

    } finally {
      setLoading(false);
    }
  };

  const roleLabel = role?.charAt(0).toUpperCase() + role?.slice(1);

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50">

      <Card className="w-full max-w-md rounded-2xl shadow-lg">

        <CardHeader className="text-center">
          <Coffee className="mx-auto h-10 w-10 text-orange-500" />
          <CardTitle>Register as {roleLabel}</CardTitle>
          <CardDescription>Create your account</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">

          {/* STEP 1 EMAIL */}

          {step === 1 && (
            <>
              <Label>Email</Label>

              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  handleChange("email", e.target.value)
                }
              />

              <Button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full bg-orange-500"
              >
                {loading ? <Loader2 className="animate-spin" /> : "Send OTP"}
              </Button>
            </>
          )}

          {/* STEP 2 OTP */}

          {step === 2 && (
            <>
              <Label>Enter OTP</Label>

              <Input
                value={formData.otp}
                onChange={(e) =>
                  handleChange("otp", e.target.value)
                }
              />

              <Button
                onClick={handleVerifyOtp}
                disabled={loading}
                className="w-full bg-orange-500"
              >
                Verify OTP
              </Button>
            </>
          )}

          {/* STEP 3 REGISTER */}

          {step === 3 && (
            <form onSubmit={handleRegister} className="space-y-4">

              <div>
                <Label>Name</Label>

                <Input
                  value={formData.name}
                  onChange={(e) =>
                    handleChange("name", e.target.value)
                  }
                />
              </div>

              <div>
                <Label>Password</Label>

                <div className="relative">

                  <Input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      handleChange("password", e.target.value)
                    }
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2 text-gray-500"
                  >
                    {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>

                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500"
              >
                Register
              </Button>

            </form>
          )}

          <p className="text-center text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-orange-500 font-semibold">
              Login
            </Link>
          </p>

        </CardContent>

      </Card>

    </div>
  );
};

export default RegisterPage;
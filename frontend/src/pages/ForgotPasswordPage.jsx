import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import API from "../api";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "../components/ui/card";

const ForgotPasswordPage = () => {

  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  // ================= SEND OTP =================

  const sendOtp = async () => {

    if (!email) {
      toast.error("Enter email first");
      return;
    }

    try {

      setLoading(true);

      await API.post("/auth/send-otp", {
        email: email.trim().toLowerCase()
      });

      toast.success("OTP sent to your email");

      setStep(2);

    } catch (err) {

      toast.error(
        err?.response?.data?.detail || "Failed to send OTP"
      );

    } finally {
      setLoading(false);
    }
  };

  // ================= VERIFY OTP =================

  const verifyOtp = async () => {

    if (!otp) {
      toast.error("Enter OTP");
      return;
    }

    try {

      setLoading(true);

      await API.post("/auth/verify-otp", {
        email: email.trim().toLowerCase(),
        otp
      });

      toast.success("OTP verified");

      setStep(3);

    } catch (err) {

      toast.error(
        err?.response?.data?.detail || "Invalid OTP"
      );

    } finally {
      setLoading(false);
    }
  };

  // ================= RESET PASSWORD =================

  const resetPassword = async (e) => {

    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {

      setLoading(true);

      await API.post("/auth/reset-password", {
        email: email.trim().toLowerCase(),
        password: newPassword
      });

      toast.success("Password updated successfully");

      navigate("/login");

    } catch (err) {

      toast.error(
        err?.response?.data?.detail || "Failed to update password"
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50">

      <Card className="w-full max-w-md rounded-2xl shadow-lg">

        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>
            Recover your account securely
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">

          {/* STEP 1 EMAIL */}

          {step === 1 && (
            <>
              <Label>Email</Label>

              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Button
                onClick={sendOtp}
                className="w-full bg-orange-500"
                disabled={loading}
              >
                Send OTP
              </Button>
            </>
          )}

          {/* STEP 2 OTP */}

          {step === 2 && (
            <>
              <Label>Enter OTP</Label>

              <Input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />

              <Button
                onClick={verifyOtp}
                className="w-full bg-orange-500"
                disabled={loading}
              >
                Verify OTP
              </Button>
            </>
          )}

          {/* STEP 3 RESET PASSWORD */}

          {step === 3 && (
            <form onSubmit={resetPassword} className="space-y-4">

              <div>
                <Label>New Password</Label>

                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(e.target.value)
                  }
                />
              </div>

              <div>
                <Label>Confirm Password</Label>

                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-500"
                disabled={loading}
              >
                Save Password
              </Button>

            </form>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("/login")}
          >
            Back to Login
          </Button>

        </CardContent>

      </Card>

    </div>
  );
};

export default ForgotPasswordPage;
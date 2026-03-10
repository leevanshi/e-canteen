import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

const UnauthorizedPage = () => {

  const navigate = useNavigate();
  const { user } = useAuth();

  const goHome = () => {

    if (!user) {
      navigate("/login");
      return;
    }

    if (user.role === "admin") {
      navigate("/admin/dashboard");
      return;
    }

    if (user.role === "faculty") {
      navigate("/faculty/dashboard");
      return;
    }

    navigate("/menu");

  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">

      <Card className="max-w-md w-full text-center shadow-lg rounded-2xl">

        <CardContent className="p-6 space-y-4">

          <h1 className="text-3xl font-bold text-red-600">
            🚫 Access Denied
          </h1>

          <p className="text-gray-600">
            You don’t have permission to access this page.
          </p>

          <div className="flex justify-center gap-3 mt-4">

            <Button
              className="bg-orange-500 hover:bg-orange-600"
              onClick={goHome}
            >
              Go to Dashboard
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate("/")}
            >
              Go to Home
            </Button>

          </div>

        </CardContent>

      </Card>

    </div>
  );

};

export default UnauthorizedPage;
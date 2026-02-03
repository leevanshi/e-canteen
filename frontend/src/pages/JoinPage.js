import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";

const JoinPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <h1 className="text-3xl font-bold mb-10">
        Join E-Canteen as...
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        
        {/* STUDENT */}
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <h2 className="font-semibold text-lg mb-4">Student</h2>
          <Button
            className="w-full"
            onClick={() => navigate("/register/student")}
          >
            Proceed as Student
          </Button>
        </div>

        {/* FACULTY */}
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <h2 className="font-semibold text-lg mb-4">Faculty</h2>
          <Button
            className="w-full"
            onClick={() => navigate("/register/faculty")}
          >
            Proceed as Faculty
          </Button>
        </div>

        {/* ADMIN */}
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <h2 className="font-semibold text-lg mb-4">Admin</h2>
          <Button
            className="w-full"
            onClick={() => navigate("/register/admin")}
          >
            Proceed as Admin
          </Button>
        </div>

      </div>
    </div>
  );
};

export default JoinPage;

import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";

const roles = [
  {
    name: "Student",
    path: "/register/student"
  },
  {
    name: "Faculty",
    path: "/register/faculty"
  },
  {
    name: "Admin",
    path: "/register/admin"
  }
];

const JoinPage = () => {

  const navigate = useNavigate();

  return (

    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">

      <h1 className="text-3xl font-bold mb-2">
        Join E-Canteen
      </h1>

      <p className="text-gray-500 mb-10">
        Choose how you want to register
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">

        {roles.map((role) => (

          <div
            key={role.name}
            className="bg-white rounded-xl shadow p-6 text-center hover:shadow-md transition"
          >

            <h2 className="font-semibold text-lg mb-4">
              {role.name}
            </h2>

            <Button
              className="w-full"
              onClick={() => navigate(role.path)}
            >
              Proceed as {role.name}
            </Button>

          </div>

        ))}

      </div>

    </div>

  );

};

export default JoinPage;
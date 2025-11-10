import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import StudentDashboard from "@/components/StudentDashboard";
import AdminDashboard from "@/components/AdminDashboard";
import { Loader2 } from "lucide-react";

const Dashboard = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return isAdmin ? <AdminDashboard /> : <StudentDashboard />;
};

export default Dashboard;

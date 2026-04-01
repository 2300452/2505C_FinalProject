import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

function RoleRoute({ allowedRoles = [], children }) {
  const { ready, user } = useAuth();

  if (!ready) {
    return null;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export default RoleRoute;

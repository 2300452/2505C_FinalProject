import { createContext, useContext, useEffect, useState } from "react";
import {
  authenticateUser,
  changePassword,
  getUserById,
  initializeDemoData,
} from "../services/demoStore";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const restoreUser = async () => {
      await initializeDemoData();

      const storedUserId = sessionStorage.getItem("pb_current_user_id");
      if (!storedUserId) {
        setReady(true);
        return;
      }

      const existingUser = await getUserById(storedUserId);
      if (existingUser) {
        setUser(existingUser);
      } else {
        sessionStorage.removeItem("pb_current_user_id");
      }
      setReady(true);
    };

    restoreUser();
  }, []);

  const login = async ({ portal, email, password }) => {
    const foundUser = await authenticateUser({ portal, email, password });
    sessionStorage.setItem("pb_current_user_id", String(foundUser.id));
    setUser(foundUser);
    return foundUser;
  };

  const logout = () => {
    sessionStorage.removeItem("pb_current_user_id");
    setUser(null);
  };

  const refreshUser = async () => {
    if (!user) return;
    const refreshed = await getUserById(user.id);
    if (refreshed) {
      setUser(refreshed);
    }
  };

  const changeOwnPassword = async (newPassword) => {
    if (!user) return null;
    const updatedUser = await changePassword(user.id, newPassword);
    setUser(updatedUser);
    return updatedUser;
  };

  return (
    <AuthContext.Provider
      value={{
        ready,
        user,
        login,
        logout,
        refreshUser,
        changeOwnPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

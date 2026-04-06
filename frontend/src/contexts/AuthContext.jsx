import { createContext, useContext, useEffect, useState } from "react";
import {
  authenticateUser,
  changePassword,
  getUserById,
  initializeDemoData,
} from "../services/demoStore";

const AuthContext = createContext();

function generateTwoFactorCode() {
  return String(Math.floor(Math.random() * 900000) + 100000);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [pendingTwoFactor, setPendingTwoFactor] = useState(null);

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

  const login = async ({ portal, email, password, twoFactorCode }) => {
    const challengeKey = `${portal}:${String(email || "").toLowerCase()}`;
    if (twoFactorCode && pendingTwoFactor?.key === challengeKey) {
      if (twoFactorCode === pendingTwoFactor.code) {
        let verifiedUser = pendingTwoFactor.user;

        if (!verifiedUser && pendingTwoFactor.backendCode) {
          const redeemedUser = await authenticateUser({
            portal,
            email,
            password,
            twoFactorCode: pendingTwoFactor.backendCode,
          });
          verifiedUser = redeemedUser.requiresTwoFactor ? redeemedUser.user : redeemedUser;
        }

        if (!verifiedUser?.id) {
          return {
            requiresTwoFactor: true,
            twoFactorCode: pendingTwoFactor.code,
            qrPayload: `PatientBuddy 2FA code: ${pendingTwoFactor.code}`,
            email,
          };
        }

        sessionStorage.setItem("pb_current_user_id", String(verifiedUser.id));
        setUser(verifiedUser);
        setPendingTwoFactor(null);
        return verifiedUser;
      }

      return {
        requiresTwoFactor: true,
        twoFactorCode: pendingTwoFactor.code,
        qrPayload: `PatientBuddy 2FA code: ${pendingTwoFactor.code}`,
        email,
      };
    }

    const foundUser = await authenticateUser({ portal, email, password, twoFactorCode });
    if (foundUser.requiresTwoFactor) {
      const expectedCode = generateTwoFactorCode();
      setPendingTwoFactor({
        key: challengeKey,
        code: expectedCode,
        backendCode: foundUser.twoFactorCode,
        user: foundUser.user || null,
      });
      return {
        ...foundUser,
        twoFactorCode: expectedCode,
        qrPayload: `PatientBuddy 2FA code: ${expectedCode}`,
      };
    }

    if (twoFactorCode && !pendingTwoFactor) {
      sessionStorage.setItem("pb_current_user_id", String(foundUser.id));
      setUser(foundUser);
      return foundUser;
    }

    const expectedCode = generateTwoFactorCode();
    setPendingTwoFactor({ key: challengeKey, code: expectedCode, user: foundUser });
    if (!twoFactorCode) {
      return {
        requiresTwoFactor: true,
        twoFactorCode: expectedCode,
        qrPayload: `PatientBuddy 2FA code: ${expectedCode}`,
        email: foundUser.email,
      };
    }

    return {
      requiresTwoFactor: true,
      twoFactorCode: expectedCode,
      qrPayload: `PatientBuddy 2FA code: ${expectedCode}`,
      email: foundUser.email,
    };
  };

  const logout = () => {
    sessionStorage.removeItem("pb_current_user_id");
    setPendingTwoFactor(null);
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

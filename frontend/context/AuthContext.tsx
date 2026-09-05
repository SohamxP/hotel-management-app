import * as SecureStore from "expo-secure-store";
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  setAuthToken,
  setUnauthorizedHandler,
} from "../api/api";

const TOKEN_KEY = "hotel_auth_token";
const USER_KEY = "hotel_auth_user";

type AuthUser = {
  userId: number;
  employeeId: number;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
};

type AuthContextType = {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;

  login: (
    newToken: string,
    user: AuthUser
  ) => Promise<void>;

  logout: () => Promise<void>;
};

const AuthContext =
  createContext<AuthContextType | null>(
    null
  );

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [token, setToken] =
    useState<string | null>(null);

  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [loading, setLoading] =
    useState(true);
  useEffect(() => {
    restoreSession();
  }, []);
  
  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, []);
  async function restoreSession() {
    try {
      const [
        storedToken,
        storedUser,
      ] = await Promise.all([
        SecureStore.getItemAsync(
          TOKEN_KEY
        ),
        SecureStore.getItemAsync(
          USER_KEY
        ),
      ]);

      if (
        storedToken &&
        storedUser
      ) {
        const parsedUser =
          JSON.parse(storedUser);

        setToken(storedToken);
        setUser(parsedUser);

        setAuthToken(storedToken);
      }
    } catch (error) {
      console.error(
        "Failed to restore auth session:",
        error
      );

      await SecureStore.deleteItemAsync(
        TOKEN_KEY
      );

      await SecureStore.deleteItemAsync(
        USER_KEY
      );

      setAuthToken(null);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(
    newToken: string,
    newUser: AuthUser
  ) {
    await Promise.all([
      SecureStore.setItemAsync(
        TOKEN_KEY,
        newToken
      ),

      SecureStore.setItemAsync(
        USER_KEY,
        JSON.stringify(newUser)
      ),
    ]);

    setToken(newToken);
    setUser(newUser);

    setAuthToken(newToken);
  }

  async function logout() {
    await Promise.all([
      SecureStore.deleteItemAsync(
        TOKEN_KEY
      ),

      SecureStore.deleteItemAsync(
        USER_KEY
      ),
    ]);

    setToken(null);
    setUser(null);

    setAuthToken(null);
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        isAuthenticated:
          Boolean(token),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}
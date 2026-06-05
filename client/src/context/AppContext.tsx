import axios, { type AxiosInstance } from "axios";
import {
  createContext,
  useState,
  useEffect,
  useContext,
  type ReactNode,
} from "react";

interface User {
  id: string;
  name: string;
  email: string;
  plan: string;
  analysisCount?: number;
}

interface AppContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  api: AxiosInstance;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; message?: string }>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [loading, setLoading] = useState(true);

  // Axios instance
  const api = axios.create({
    baseURL: BACKEND_URL,
  });

  // Attach token to requests
  api.interceptors.request.use((config) => {
    const storedToken = localStorage.getItem("token");

    if (storedToken) {
      config.headers.Authorization = `Bearer ${storedToken}`;
    }

    return config;
  });

  const loadUser = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get("/api/auth/user");

      if (data.success) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadUser();
  }, [token]);

  // ================= LOGIN =================
  const login = async (email: string, password: string) => {
    try {
      const { data } = await axios.post(
        `${BACKEND_URL}/api/auth/login`,
        { email, password }
      );

      if (!data?.success) {
        return {
          success: false,
          message: data?.message || "Login failed",
        };
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem("token", data.token);

      return {
        success: true,
        message: data.message || "Login successful",
      };
    } catch (error: any) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Login failed",
      };
    }
  };

  // ================= REGISTER =================
  const register = async (
    name: string,
    email: string,
    password: string
  ) => {
    try {
      const { data } = await axios.post(
        `${BACKEND_URL}/api/auth/register`,
        { name, email, password }
      );

      if (!data?.success) {
        return {
          success: false,
          message: data?.message || "Registration failed",
        };
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem("token", data.token);

      return {
        success: true,
        message: data.message || "Account created successfully",
      };
    } catch (error: any) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Registration failed",
      };
    }
  };

  // ================= LOGOUT =================
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
  };

  const value: AppContextType = {
    user,
    token,
    loading,
    api,
    login,
    register,
    logout,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }

  return context;
}
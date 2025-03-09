import { createContext, useContext, useState, ReactNode, useMemo, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Define the User type
interface User {
  id?: string;
  username: string;
  email: string;
  name: string;
}

// Define the authentication context type
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, confirmPassword: string, name: string) => Promise<void>;
  logout: () => void;
}

// Create the AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!localStorage.getItem("token"));
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      axios
        .get<User>("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } }) // Fetch user data
        .then((response) => {
          setUser(response.data);
          setIsAuthenticated(true);
        })
        .catch(() => {
          logout(); // Logout if token is invalid
        });
    }
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post<{ token: string; user: User }>("https://softinvite-api.onrender.com/admin/login", { 
        email, 
        password 
      });

      const { token, user } = response.data;
      localStorage.setItem("token", token);
      setUser(user);
      setIsAuthenticated(true);
      navigate("/home"); // Redirect after login
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  // Register function
  const register = async (username: string, email: string, password: string, confirmPassword: string, name: string) => {
    try {
      const response = await axios.post("https://softinvite-api.onrender.com/admin/register", {
        username,
        email,
        password,
        confirm_password: confirmPassword,
        name,
      });

      console.log("Registration successful:", response.data);
      navigate("/sign-in"); // Redirect to sign-in after successful registration
    } catch (error) {
      console.error("Registration failed", error);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setIsAuthenticated(false);
    navigate("/sign-in");
  };

  // Memoize the context value to avoid re-renders
  const authContextValue = useMemo(
    () => ({
      isAuthenticated,
      user,
      login,
      register,
      logout,
    }),
    [isAuthenticated, user]
  );

  return <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>;
};

// Hook to use authentication
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type User = {
  id: string;
  email: string;
  full_name: string | null;
  role: "owner" | "admin" | "member";
  is_active: boolean;
  created_at: string;
};

type Tenant = {
  id: string;
  name: string;
  slug: string;
  email: string;
  is_active: boolean;
  created_at: string;
};

interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  token: string | null;
  setAuth: (user: User, tenant: Tenant, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("user");
    const tn = localStorage.getItem("tenant");
    if (t && u && tn) {
      setToken(t);
      setUser(JSON.parse(u));
      setTenant(JSON.parse(tn));
    }
  }, []);

  const setAuth = (user: User, tenant: Tenant, token: string) => {
    setUser(user);
    setTenant(tenant);
    setToken(token);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("tenant", JSON.stringify(tenant));
  };

  const logout = () => {
    setUser(null);
    setTenant(null);
    setToken(null);
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{
      user, tenant, token,
      setAuth, logout,
      isAuthenticated: !!token
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Zap, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { login } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("admin@acme.com");
  const [password, setPassword] = useState("secret123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await login({ email, password });
      const token = res.data.access_token;
      localStorage.setItem("token", token);

      // Decode tenant info from token
      const payload = JSON.parse(atob(token.split(".")[1]));
      const mockUser = { id: payload.sub, email, full_name: "Acme Admin", role: "owner" as const, is_active: true, created_at: new Date().toISOString() };
      const mockTenant = { id: payload.tenant_id, name: "Acme Corp", slug: "acme", email: "acme@example.com", is_active: true, created_at: new Date().toISOString() };

      setAuth(mockUser, mockTenant, token);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-xl shadow-brand-500/25 mb-4">
            <Zap size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-dark-300 mt-1">Sign in to your FinanceOps account</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-300" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="you@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-300" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input pl-10"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-dark-600 text-center">
            <p className="text-dark-300 text-sm">
              Don't have an account?{" "}
              <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
                Create one
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-dark-400 text-xs mt-6">
          Demo credentials pre-filled above
        </p>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Zap, Loader2, ArrowRight } from "lucide-react";
import { register } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [form, setForm] = useState({
    orgName: "", slug: "", orgEmail: "",
    fullName: "", email: "", password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuth();
  const navigate = useNavigate();

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await register({
        tenant: { name: form.orgName, slug: form.slug, email: form.orgEmail },
        user: { email: form.email, password: form.password, full_name: form.fullName }
      });
      const { tenant, user, access_token } = res.data;
      setAuth(user, tenant, access_token);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/3 w-96 h-96 bg-brand-600/8 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-xl shadow-brand-500/25 mb-4">
            <Zap size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-dark-300 mt-1">Set up your organization in seconds</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <p className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 text-xs flex items-center justify-center">1</span>
                Organization details
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-dark-300 mb-1.5">Organization name</label>
                  <input className="input" placeholder="Acme Corp" value={form.orgName} onChange={e => update("orgName", e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-dark-300 mb-1.5">Slug</label>
                    <input className="input" placeholder="acme" value={form.slug} onChange={e => update("slug", e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-sm text-dark-300 mb-1.5">Org email</label>
                    <input type="email" className="input" placeholder="hello@acme.com" value={form.orgEmail} onChange={e => update("orgEmail", e.target.value)} required />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-dark-600 pt-6">
              <p className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 text-xs flex items-center justify-center">2</span>
                Your account
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-dark-300 mb-1.5">Full name</label>
                  <input className="input" placeholder="Jane Smith" value={form.fullName} onChange={e => update("fullName", e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm text-dark-300 mb-1.5">Email</label>
                  <input type="email" className="input" placeholder="jane@acme.com" value={form.email} onChange={e => update("email", e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm text-dark-300 mb-1.5">Password</label>
                  <input type="password" className="input" placeholder="••••••••" value={form.password} onChange={e => update("password", e.target.value)} required />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-dark-600 text-center">
            <p className="text-dark-300 text-sm">
              Already have an account?{" "}
              <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState, useCallback } from "react";
import { AlertTriangle, CheckCircle, Clock, Zap, DollarSign, RefreshCw } from "lucide-react";
import { useWebSocket, type WebSocketMessage } from "../hooks/useWebSocket";
import api from "../services/api";

type Anomaly = {
  id: string;
  anomaly_type: string;
  severity: string;
  description: string;
  ai_explanation: string | null;
  resolved: string;
  detected_at: string;
};

const severityStyles: Record<string, string> = {
  low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
};

const typeIcons: Record<string, React.ReactElement> = {
  high_failure_rate: <AlertTriangle size={18} />,
  velocity_spike: <Zap size={18} />,
  large_transaction: <DollarSign size={18} />,
  repeated_failures: <RefreshCw size={18} />,
  unusual_refund: <RefreshCw size={18} />,
};

export default function Anomalies() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [explaining, setExplaining] = useState<string | null>(null);

  const fetchAnomalies = async () => {
    try {
      const res = await api.get("/api/v1/anomalies");
      setAnomalies(res.data.anomalies);
    } catch (err) {
      console.error("Failed to fetch anomalies:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, []);

  // Real-time updates
  const handleMessage = useCallback((msg: WebSocketMessage) => {
    if (msg.type === "new_anomaly") {
      setAnomalies(prev => [msg.data, ...prev]);
    }
  }, []);

  const { connected } = useWebSocket({ onMessage: handleMessage });

  const resolveAnomaly = async (id: string) => {
    try {
      await api.post(`/api/v1/anomalies/${id}/resolve`);
      setAnomalies(prev =>
        prev.map(a => (a.id === id ? { ...a, resolved: "true" } : a))
      );
    } catch (err) {
      console.error("Failed to resolve anomaly:", err);
    }
  };

  const explainAnomaly = async (id: string) => {
    setExplaining(id);
    try {
      const res = await api.post(`/api/v1/anomalies/${id}/explain`);
      setAnomalies(prev =>
        prev.map(a =>
          a.id === id ? { ...a, ai_explanation: res.data.ai_explanation } : a
        )
      );
    } catch (err) {
      console.error("Failed to get explanation:", err);
    } finally {
      setExplaining(null);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Anomaly Detection</h1>
          <p className="text-dark-300 mt-0.5">AI-powered payment anomaly monitoring</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-700 border border-dark-500">
          <div className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
          <span className="text-sm text-dark-300">{connected ? "Live" : "Reconnecting..."}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-dark-300 text-sm">Total Anomalies</p>
          <p className="text-2xl font-bold text-white mt-1">{anomalies.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-dark-300 text-sm">Critical</p>
          <p className="text-2xl font-bold text-red-400 mt-1">
            {anomalies.filter(a => a.severity === "critical").length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-dark-300 text-sm">High</p>
          <p className="text-2xl font-bold text-orange-400 mt-1">
            {anomalies.filter(a => a.severity === "high").length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-dark-300 text-sm">Resolved</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {anomalies.filter(a => a.resolved === "true").length}
          </p>
        </div>
      </div>

      {/* Anomaly list */}
      <div className="card p-6">
        <h2 className="font-semibold text-white mb-4">Recent Anomalies</h2>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-dark-700 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : anomalies.length === 0 ? (
          <div className="text-center py-12 text-dark-300">
            <CheckCircle size={48} className="mx-auto mb-4 text-emerald-400" />
            <p>No anomalies detected. Your payments are healthy!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {anomalies.map(anomaly => (
              <div
                key={anomaly.id}
                className={`p-4 rounded-xl border ${severityStyles[anomaly.severity]} ${
                  anomaly.resolved === "true" ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {typeIcons[anomaly.anomaly_type] || <AlertTriangle size={18} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white capitalize">
                          {anomaly.anomaly_type.replace(/_/g, " ")}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${severityStyles[anomaly.severity]}`}>
                          {anomaly.severity}
                        </span>
                        {anomaly.resolved === "true" && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                            Resolved
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-dark-300 mt-1">{anomaly.description}</p>
                      <p className="text-xs text-dark-400 mt-1">
                        <Clock size={12} className="inline mr-1" />
                        {new Date(anomaly.detected_at).toLocaleString()}
                      </p>

                      {/* AI Explanation */}
                      {anomaly.ai_explanation && (
                        <div className="mt-3 p-3 rounded-lg bg-dark-800 border border-dark-600">
                          <p className="text-xs text-brand-400 font-medium mb-1">AI Analysis</p>
                          <p className="text-sm text-dark-200">{anomaly.ai_explanation}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {!anomaly.ai_explanation && (
                      <button
                        onClick={() => explainAnomaly(anomaly.id)}
                        disabled={explaining === anomaly.id}
                        className="px-3 py-1.5 text-xs rounded-lg bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 transition-colors disabled:opacity-50"
                      >
                        {explaining === anomaly.id ? "Analyzing..." : "Explain"}
                      </button>
                    )}
                    {anomaly.resolved !== "true" && (
                      <button
                        onClick={() => resolveAnomaly(anomaly.id)}
                        className="px-3 py-1.5 text-xs rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

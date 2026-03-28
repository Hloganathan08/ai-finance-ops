
type AIInsight = { question: string; answer: string; data_points: { label: string; value: string }[] | null; anomalies: string[] | null; };
import { useState } from "react";
import { queryAI } from "../services/api";
import { Sparkles, Send, Loader2, AlertTriangle, BarChart2, MessageSquare } from "lucide-react";
import clsx from "clsx";

const suggestions = [
  "What is my total revenue this month?",
  "Are there any payment anomalies I should know about?",
  "What is my payment success rate?",
  "How many active subscriptions do I have?",
  "Summarize my billing performance",
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  insight?: AIInsight;
  loading?: boolean;
}

export default function AIInsights() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async (question: string) => {
    if (!question.trim() || loading) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: question,
    };
    const loadingMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      loading: true,
    };
    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await queryAI(question);
      const { success, insight, error } = res.data;
      setMessages(prev =>
        prev.map(m =>
          m.id === loadingMsg.id
            ? {
                ...m,
                loading: false,
                content: success ? insight.answer : (error || "Something went wrong"),
                insight: success ? insight : undefined,
              }
            : m
        )
      );
    } catch (e) {
      setMessages(prev =>
        prev.map(m =>
          m.id === loadingMsg.id
            ? { ...m, loading: false, content: "Failed to get AI response. Please try again." }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-brand-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Sparkles size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">AI Billing Insights</h1>
          <p className="text-dark-300 text-sm">Ask anything about your billing data</p>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center pb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-brand-600/20 border border-purple-500/20 flex items-center justify-center mb-4">
              <Sparkles size={28} className="text-purple-400" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Ask your billing AI</h3>
            <p className="text-dark-300 text-sm max-w-md mb-8">
              Get instant insights about your revenue, subscriptions, payment patterns, and anomalies.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl w-full">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  className="text-left px-4 py-3 rounded-xl bg-dark-800 border border-dark-600 hover:border-brand-600/40 hover:bg-dark-700 transition-all text-sm text-dark-300 hover:text-white"
                >
                  <MessageSquare size={13} className="inline mr-2 text-brand-400" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className={clsx("flex", msg.role === "user" ? "justify-end" : "justify-start")}
            >
              {msg.role === "user" ? (
                <div className="max-w-lg bg-brand-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm">
                  {msg.content}
                </div>
              ) : (
                <div className="max-w-2xl w-full space-y-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-brand-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles size={13} className="text-white" />
                    </div>
                    <div className="card px-4 py-3 flex-1">
                      {msg.loading ? (
                        <div className="flex items-center gap-2 text-dark-300">
                          <Loader2 size={14} className="animate-spin" />
                          <span className="text-sm">Analyzing your billing data...</span>
                        </div>
                      ) : (
                        <p className="text-sm text-white leading-relaxed">{msg.content}</p>
                      )}
                    </div>
                  </div>

                  {/* Data points */}
                  {msg.insight?.data_points && msg.insight.data_points.length > 0 && (
                    <div className="ml-9">
                      <div className="flex items-center gap-1.5 text-xs text-dark-300 mb-2">
                        <BarChart2 size={12} />
                        Key metrics
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {msg.insight.data_points.map((dp, i) => (
                          <div key={i} className="card px-3 py-2.5">
                            <p className="text-xs text-dark-300 mb-0.5">{dp.label}</p>
                            <p className="text-sm font-semibold text-white">{dp.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Anomalies */}
                  {msg.insight?.anomalies && msg.insight.anomalies.length > 0 && (
                    <div className="ml-9">
                      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400 mb-2">
                          <AlertTriangle size={12} />
                          Anomalies detected
                        </div>
                        {msg.insight.anomalies.map((a, i) => (
                          <p key={i} className="text-xs text-amber-300/80">• {a}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="card p-3 flex items-center gap-3">
        <input
          className="flex-1 bg-transparent text-white placeholder-dark-300 text-sm focus:outline-none px-2"
          placeholder="Ask about your billing data..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
          disabled={loading}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          className="w-9 h-9 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all flex-shrink-0"
        >
          {loading
            ? <Loader2 size={15} className="text-white animate-spin" />
            : <Send size={15} className="text-white" />
          }
        </button>
      </div>
    </div>
  );
}

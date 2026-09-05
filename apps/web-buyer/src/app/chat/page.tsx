"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import AgentTrace from "@/components/AgentTrace";
import { Send, Bot, User, Loader2, X, Plus } from "lucide-react";

const STORAGE_KEY = "zkprocure_chat_messages";
const SESSION_KEY = "zkprocure_session_id";
const TRACES_KEY = "zkprocure_traces";

function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return generateSessionId();
  const existing = localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const newId = generateSessionId();
  localStorage.setItem(SESSION_KEY, newId);
  return newId;
}

const DEFAULT_MESSAGES = [
  { role: "agent", content: "Hello! I am your ZK-Procure procurement agent. How can I help you today?" }
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Array<{role: string, content: string, hasPayment?: boolean}>>(DEFAULT_MESSAGES);
  const [input, setInput] = useState("");
  const [traces, setTraces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load saved state from localStorage on mount
  useEffect(() => {
    const sid = getOrCreateSessionId();
    setSessionId(sid);

    try {
      const savedMessages = localStorage.getItem(STORAGE_KEY);
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
      const savedTraces = localStorage.getItem(TRACES_KEY);
      if (savedTraces) {
        const parsed = JSON.parse(savedTraces);
        if (Array.isArray(parsed)) setTraces(parsed);
      }
    } catch { /* ignore parse errors */ }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 1 || messages[0]?.content !== DEFAULT_MESSAGES[0].content) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  // Save traces
  useEffect(() => {
    if (traces.length > 0) {
      localStorage.setItem(TRACES_KEY, JSON.stringify(traces));
    }
  }, [traces]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleNewChat = async () => {
    // Clear backend session
    try {
      await fetch("http://localhost:3001/api/agent/clear-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId })
      });
    } catch { /* ignore */ }

    // Generate new session
    const newSid = generateSessionId();
    localStorage.setItem(SESSION_KEY, newSid);
    setSessionId(newSid);

    // Clear frontend state
    setMessages(DEFAULT_MESSAGES);
    setTraces([]);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TRACES_KEY);
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setMessages(prev => [...prev, { role: "agent", content: "Request cancelled." }]);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
      const response = await fetch("http://localhost:3001/api/agent/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          organizationId: "11111111-1111-1111-1111-111111111111",
          message: currentInput,
          sessionId: sessionId
        }),
        signal: controller.signal
      });
      const data = await response.json();
      
      if (data.runId) {
        try {
          const traceRes = await fetch(`http://localhost:3001/api/agent/runs/${data.runId}/trace`, {
            signal: controller.signal
          });
          const traceData = await traceRes.json();
          if (traceData.actions) {
            setTraces(prev => [...prev, ...traceData.actions.map((a: any) => ({
              name: a.tool_name,
              status: a.allowed ? "success" : "failed",
              args: (() => { try { return JSON.parse(a.tool_input); } catch { return {}; } })(),
              result: a.tool_output
            }))]);
          }
        } catch { /* trace fetch is optional */ }
      }

      setMessages(prev => [...prev, { 
        role: "agent", 
        content: data.text || "Sorry, an error occurred.",
        hasPayment: data.text?.includes("proceed with the payment") || data.text?.includes("payment of") || data.text?.includes("Payment proposed")
      }]);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setMessages(prev => [...prev, { role: "agent", content: "⏱️ Request timed out. The AI model might be experiencing high demand. Please try again." }]);
      } else {
        setMessages(prev => [...prev, { role: "agent", content: "Error connecting to agent backend. Make sure the API server is running." }]);
      }
    } finally {
      clearTimeout(timeoutId);
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Chat Panel */}
      <div className="flex-1 flex flex-col bg-secondary border border-muted rounded-xl overflow-hidden">
        <div className="p-4 border-b border-muted bg-secondary flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Bot className="w-5 h-5 text-accent" /> AI Procurement Agent
          </h2>
          <button
            onClick={handleNewChat}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white bg-muted hover:bg-muted/80 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-xl p-4 ${
                msg.role === "user" ? "bg-accent text-white" : "bg-muted text-gray-100"
              }`}>
                <div className="flex items-center gap-2 mb-2 opacity-80 text-sm">
                  {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  {msg.role === "user" ? "You" : "Agent"}
                </div>
                <div className="whitespace-pre-wrap">{msg.content}</div>
                {msg.hasPayment && (
                  <button className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                    Proceed to Payment
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted text-gray-100 rounded-xl p-4 flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-accent" />
                <span className="text-sm text-gray-400">Agent is thinking...</span>
                <button 
                  onClick={handleCancel}
                  className="ml-2 text-red-400 hover:text-red-300 p-1 rounded transition-colors"
                  title="Cancel request"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-muted bg-secondary">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder={isLoading ? "Waiting for agent response..." : "Ask the agent to procure something..."}
              disabled={isLoading}
              className="flex-1 bg-background border border-muted rounded-lg px-4 py-3 focus:outline-none focus:border-accent disabled:opacity-50"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-accent hover:bg-blue-600 text-white p-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Trace Panel */}
      <div className="w-80 bg-secondary border border-muted rounded-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-muted bg-secondary">
          <h2 className="font-semibold text-sm">Agent Trace</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <AgentTrace traces={traces} />
        </div>
      </div>
    </div>
  );
}

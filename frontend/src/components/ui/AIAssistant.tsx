import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { sendChatMessage, fetchChatHistory } from "@/lib/api";
import { MessageCircle, X, Send } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
}

const INITIAL_MESSAGE: Message = {
  id: "0",
  role: "assistant",
  text: "Hi! I'm your NovaBank AI assistant. How can I help you today?",
};

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (!open || hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    setHistoryLoading(true);
    fetchChatHistory()
      .then((history) => {
        if (history.length > 0) {
          setMessages(history.map((m, i) => ({ id: String(i), role: m.role, text: m.content })));
        }
      })
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [open]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", text };
    const thinkingId = userMsg.id + "t";
    const nextMessages = [...messages, userMsg];

    setMessages([...nextMessages, { id: thinkingId, role: "assistant", text: "..." }]);
    setInput("");
    setLoading(true);

    try {
      const reply = await sendChatMessage(text);
      setMessages((prev) => prev.map((m) => (m.id === thinkingId ? { ...m, text: reply } : m)));
    } catch (err) {
      const isRateLimit = err instanceof Error && err.message === "rate_limit_exceeded";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === thinkingId
            ? {
                ...m,
                text: isRateLimit
                  ? "You've sent too many messages. Please wait a moment and try again."
                  : "Sorry, I couldn't reach the server. Please try again.",
              }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSend();
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-80 h-96 bg-brand-surface rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-white/10"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-brand-accent" />
                <span className="text-sm font-semibold text-brand-fg">NovaBank Assistant</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-brand-fg-muted hover:text-brand-fg transition-colors cursor-pointer"
                aria-label="Close chat"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {historyLoading ? (
                <div className="flex justify-center items-center h-full">
                  <span className="flex gap-1 items-center">
                    {[0, 150, 300].map((delay) => (
                      <span
                        key={delay}
                        className="w-1.5 h-1.5 rounded-full bg-brand-fg-muted animate-dot-pulse"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </span>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-brand-accent text-brand-bg font-medium rounded-br-sm"
                          : "bg-brand-bg text-brand-fg rounded-bl-sm"
                      }`}
                    >
                      {msg.text === "..." ? (
                        <span className="flex gap-1 items-center h-4">
                          {[0, 150, 300].map((delay) => (
                            <span
                              key={delay}
                              className="w-1.5 h-1.5 rounded-full bg-brand-fg-muted animate-dot-pulse"
                              style={{ animationDelay: `${delay}ms` }}
                            />
                          ))}
                        </span>
                      ) : (
                        msg.text
                      )}
                    </div>
                  </div>
                ))
              )}
              {!historyLoading && <div ref={bottomRef} />}
            </div>

            <div className="px-4 py-3 border-t border-white/10 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask something…"
                disabled={loading}
                className="flex-1 h-9 rounded-xl bg-brand-bg border border-white/10 focus:border-brand-accent px-3 text-sm text-brand-fg placeholder:text-brand-fg-muted outline-none transition-colors disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl bg-brand-accent text-brand-bg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-40 disabled:pointer-events-none"
                aria-label="Send message"
              >
                <Send size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full bg-brand-accent text-brand-bg shadow-lg shadow-brand-accent/30 flex items-center justify-center"
        aria-label="Open AI assistant"
      >
        <MessageCircle size={24} />
      </motion.button>
    </div>
  );
}

import { Fragment, useEffect, useRef, useState } from "react";

import { Bot, MessageCircle, Send, User, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { fetchChatHistory, sendChatMessage } from "@/lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp?: Date;
}

const INITIAL_MESSAGE: Message = {
  id: "0",
  role: "assistant",
  text: "Hi! I'm your NovaBank AI assistant. How can I help you today?",
  timestamp: new Date(),
};

function validDate(value: unknown): Date | undefined {
  const d = new Date(value as string);
  return isNaN(d.getTime()) ? undefined : d;
}

function formatDayLabel(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasFetchedRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (!open) {
      hasFetchedRef.current = false;
      return;
    }
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    setHistoryLoading(true);
    fetchChatHistory()
      .then((history) => {
        if (history.length > 0) {
          setMessages(
            history.map((m, i) => ({
              id: String(i),
              role: m.role,
              text: m.content,
              timestamp: validDate(m.created_at),
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [open]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text,
      timestamp: new Date(),
    };
    const thinkingId = userMsg.id + "t";

    setMessages((prev) => [...prev, userMsg, { id: thinkingId, role: "assistant", text: "..." }]);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.overflowY = "hidden";
    }
    setLoading(true);

    try {
      const reply = await sendChatMessage(text);
      const replyTimestamp = new Date();
      setMessages((prev) =>
        prev.map((m) =>
          m.id === thinkingId ? { ...m, text: reply, timestamp: replyTimestamp } : m
        )
      );
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

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const MAX_TEXTAREA_HEIGHT = 144; // max-h-36

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
    el.style.overflowY = el.scrollHeight >= MAX_TEXTAREA_HEIGHT ? "auto" : "hidden";
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
            className="hidden sm:block fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed inset-0 sm:static w-full sm:w-96 h-full sm:h-[32rem] bg-brand-surface rounded-none sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border-0 sm:border border-white/10"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-brand-accent flex items-center justify-center shrink-0">
                    <Bot size={14} className="text-brand-bg" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-brand-fg leading-tight">
                      NovaBank Assistant
                    </span>
                    <span className="flex items-center gap-1 text-xs text-brand-fg-muted">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      Online
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 text-brand-fg-muted hover:text-brand-fg transition-colors cursor-pointer"
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
                  messages.map((msg, i) => {
                    const prevMsg = messages[i - 1];
                    const showSeparator =
                      msg.timestamp &&
                      (!prevMsg?.timestamp ||
                        msg.timestamp.toDateString() !== prevMsg.timestamp.toDateString());
                    return (
                      <Fragment key={msg.id}>
                        {showSeparator && (
                          <div className="flex items-center gap-2 my-1">
                            <hr className="flex-1 border-white/10" />
                            <span className="text-[10px] text-brand-fg-muted/60 select-none">
                              {formatDayLabel(msg.timestamp!)}
                            </span>
                            <hr className="flex-1 border-white/10" />
                          </div>
                        )}
                        <div
                          className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          {msg.role === "assistant" && (
                            <div className="w-6 h-6 rounded-full bg-brand-accent flex items-center justify-center shrink-0">
                              <Bot size={12} className="text-brand-bg" />
                            </div>
                          )}
                          <div
                            className={`flex flex-col max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"}`}
                          >
                            <div
                              className={`px-4 py-2.5 rounded-3xl text-sm leading-relaxed ${
                                msg.role === "user"
                                  ? "bg-brand-accent text-brand-bg font-medium rounded-br-sm whitespace-pre-wrap"
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
                              ) : msg.role === "assistant" ? (
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    p: ({ children }) => (
                                      <p className="mb-1 last:mb-0">{children}</p>
                                    ),
                                    strong: ({ children }) => (
                                      <strong className="font-semibold">{children}</strong>
                                    ),
                                    ul: ({ children }) => (
                                      <ul className="list-disc list-inside mb-1">{children}</ul>
                                    ),
                                    ol: ({ children }) => (
                                      <ol className="list-decimal list-inside mb-1">{children}</ol>
                                    ),
                                    li: ({ children }) => <li className="mb-0.5">{children}</li>,
                                    table: ({ children }) => (
                                      <div className="overflow-x-auto my-1">
                                        <table className="w-full text-xs border-collapse">
                                          {children}
                                        </table>
                                      </div>
                                    ),
                                    th: ({ children }) => (
                                      <th className="border border-white/20 bg-white/5 px-2 py-1 text-left font-semibold">
                                        {children}
                                      </th>
                                    ),
                                    td: ({ children }) => (
                                      <td className="border border-white/20 px-2 py-1">
                                        {children}
                                      </td>
                                    ),
                                  }}
                                >
                                  {msg.text}
                                </ReactMarkdown>
                              ) : (
                                msg.text
                              )}
                            </div>
                            {msg.timestamp && msg.text !== "..." && (
                              <p className="text-[10px] text-brand-fg-muted/60 mt-0.5 px-1 select-none">
                                {msg.timestamp.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                })}
                              </p>
                            )}
                          </div>
                          {msg.role === "user" && (
                            <div className="w-6 h-6 rounded-full bg-brand-fg-muted/30 flex items-center justify-center shrink-0">
                              <User size={12} className="text-brand-fg" />
                            </div>
                          )}
                        </div>
                      </Fragment>
                    );
                  })
                )}
                {!historyLoading && <div ref={bottomRef} />}
              </div>

              <div className="px-4 py-3 border-t border-white/10 flex gap-2">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask something…"
                  disabled={loading}
                  className="flex-1 min-h-9 max-h-36 rounded-xl bg-brand-bg border border-white/10 focus:border-brand-accent px-3 py-2 text-sm text-brand-fg placeholder:text-brand-fg-muted outline-none transition-colors disabled:opacity-50 resize-none overflow-y-hidden leading-5"
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
          className={`w-14 h-14 rounded-full bg-brand-accent text-brand-bg shadow-lg shadow-brand-accent/30 items-center justify-center ${open ? "hidden sm:flex" : "flex"}`}
          aria-label="Open AI assistant"
        >
          <MessageCircle size={24} />
        </motion.button>
      </div>
    </>
  );
}

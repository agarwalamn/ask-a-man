"use client";

import { useChat } from "@ai-sdk/react";
import { useRef, useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import { MarkdownMessage } from "@/components/chat/markdown-message";
import resumeData from "../../data/resume.json";

const PROFILE = {
  name: resumeData.basics.name,
  title: resumeData.basics.title,
  github: resumeData.basics.github,
  linkedin: resumeData.basics.linkedin,
  resumeUrl: resumeData.basics.resumeUrl,
};

const SUGGESTED_QUESTIONS = [
  "Walk me through your work experience",
  "What technologies do you work with?",
  "Tell me about a challenging project you've led",
  "Why should we hire Aman?",
];

function getMessageText(parts: Array<{ type: string; text?: string }>): string {
  return parts
    .filter((p) => p.type === "text" && p.text)
    .map((p) => p.text)
    .join("");
}

export default function ChatPage() {
  const { messages, sendMessage, status, error, clearError, regenerate } =
    useChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    sendMessage({ role: "user", parts: [{ type: "text", text }] });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  function submitSuggestion(q: string) {
    sendMessage({ role: "user", parts: [{ type: "text", text: q }] });
  }

  return (
    <div className="flex flex-col h-dvh bg-background">
      {/* ─── Zone A: Profile Hero Header ─── */}
      <header className="shrink-0 border-b border-border px-4 pt-6 pb-5 sm:px-6">
        <div className="max-w-3xl mx-auto">
          {/* Avatar + Name + Title */}
          <div className="flex items-center gap-4 mb-4">
            <Image
              src="/logo.png"
              alt={PROFILE.name}
              width={56}
              height={56}
              className="w-14 h-14 rounded-xl shrink-0 object-cover"
              priority
            />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-wide uppercase text-foreground">
                {PROFILE.name}
              </h1>
              <span className="inline-block mt-1 px-3 py-0.5 text-[11px] font-semibold tracking-widest uppercase border border-card-border rounded text-muted-foreground font-mono">
                {PROFILE.title}
              </span>
            </div>
          </div>

          {/* Social links + Resume */}
          <div className="flex items-center gap-3 mb-4">
            {PROFILE.github && (
              <a
                href={PROFILE.github}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg border border-card-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                aria-label="GitHub"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>
            )}
            {PROFILE.linkedin && (
              <a
                href={PROFILE.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg border border-card-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                aria-label="LinkedIn"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            )}
            {PROFILE.resumeUrl && (
              <a
                href={PROFILE.resumeUrl}
                download
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-white text-xs font-semibold uppercase tracking-wider hover:bg-accent-hover transition-colors"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download Resume
              </a>
            )}
          </div>

          {/* Trust badge */}
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-accent inline-block" />
            AI responses securely verified against resume data
          </div>
        </div>
      </header>

      {/* ─── Zone B: Chat Section ─── */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Chat section label */}
        <div className="shrink-0 px-4 sm:px-6 py-3 border-b border-border">
          <div className="max-w-3xl mx-auto flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Chat with my AI assistant
          </div>
        </div>

        {/* Messages area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-smooth">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 space-y-4">
            {/* Welcome message when empty */}
            {messages.length === 0 && (
              <div className="animate-fade-in">
                <div className="border border-bubble-assistant-border rounded-xl px-4 py-3 text-sm text-bubble-assistant-text leading-relaxed">
                  <p className="mb-2">
                    Hello! I&apos;m {PROFILE.name.split(" ")[0]}&apos;s AI
                    assistant. I have access to his full professional history
                    and blog posts.
                  </p>
                  <p>
                    I can explain his architectural decisions in recent projects
                    or discuss his experience with high-scale systems.
                  </p>
                </div>
              </div>
            )}

            {/* Message bubbles */}
            {messages.map((message, i) => {
              const text = getMessageText(message.parts);
              if (!text) return null;
              const isUser = message.role === "user";

              return (
                <div
                  key={message.id}
                  className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}
                  style={{ animationDelay: `${Math.min(i * 50, 200)}ms` }}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-xl px-4 py-3 text-sm border ${
                      isUser
                        ? "bg-bubble-user-bg border-bubble-user-border text-bubble-user-text"
                        : "bg-bubble-assistant-bg border-bubble-assistant-border text-bubble-assistant-text"
                    }`}
                  >
                    {isUser ? (
                      <span className="leading-relaxed whitespace-pre-wrap">
                        {text}
                      </span>
                    ) : (
                      <MarkdownMessage content={text} />
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start animate-fade-in">
                <div className="border border-bubble-assistant-border rounded-xl px-4 py-4">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-pulse-dot" />
                    <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-pulse-dot [animation-delay:0.2s]" />
                    <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-pulse-dot [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="flex justify-start animate-fade-in">
                <div className="max-w-[85%] sm:max-w-[75%] rounded-xl px-4 py-3 text-sm border border-red-500/40 bg-red-500/10">
                  <p className="text-red-400 mb-2">
                    {error.message.includes("429") ||
                    error.message.toLowerCase().includes("quota")
                      ? "Rate limit reached — please wait a moment and try again."
                      : "Something went wrong. The AI service may be temporarily unavailable."}
                  </p>
                  <button
                    onClick={() => {
                      clearError();
                      regenerate();
                    }}
                    className="text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Suggested question chips */}
        <div className="shrink-0 border-t border-border px-4 sm:px-6 pt-2 pb-1">
          <div className="max-w-3xl mx-auto flex gap-2 overflow-x-auto hide-scrollbar">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => submitSuggestion(q)}
                disabled={isLoading}
                className="shrink-0 text-[11px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-card-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-40 whitespace-nowrap"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input area */}
        <div className="shrink-0 px-4 sm:px-6 pt-2 pb-4">
          <form
            onSubmit={handleSubmit}
            className="max-w-3xl mx-auto flex items-end gap-2"
          >
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height =
                    Math.min(e.target.scrollHeight, 160) + "px";
                }}
                onKeyDown={handleKeyDown}
                placeholder="ask-a-man anything..."
                rows={1}
                className="w-full resize-none rounded-xl border border-card-border bg-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 placeholder:uppercase placeholder:tracking-wider placeholder:text-xs focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors disabled:opacity-50 overflow-y-auto"
                style={{ maxHeight: 160 }}
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="shrink-0 w-11 h-11 rounded-xl bg-accent flex items-center justify-center text-white hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="none"
              >
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

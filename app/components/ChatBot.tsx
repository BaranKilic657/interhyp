"use client";

import { useState, useEffect, useRef } from "react";

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content: "Hi! I'm FutureGuide, your companion on the path to homeownership. How can I help you today?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Tooltip engagement after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isOpen) {
        setShowTooltip(true);
        setTimeout(() => setShowTooltip(false), 1500);
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [isOpen]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setShowTooltip(false);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    const newMessages = [...messages, { role: "user" as const, content: inputValue }];
    setMessages(newMessages);
    setInputValue("");

    // Show typing indicator
    setIsTyping(true);

    // Simulate AI response with realistic delay
    setTimeout(() => {
      setIsTyping(false);
      setMessages([
        ...newMessages,
        {
          role: "assistant" as const,
          content: getSimulatedResponse(inputValue),
        },
      ]);
    }, 1200);
  };

  // Simulated responses based on keywords
  const getSimulatedResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes("afford") || lowerInput.includes("budget")) {
      return "Your affordability depends on several factors: your income, savings, location preferences, and current interest rates. I can help you understand what's realistic for your situation. Would you like to explore different scenarios?";
    } else if (lowerInput.includes("timeline") || lowerInput.includes("when") || lowerInput.includes("eta")) {
      return "Your timeline to homeownership depends on your savings rate, equity growth, and financing options. Small changes can shift your ETA significantly. Want to see how different life decisions affect your path?";
    } else if (lowerInput.includes("route") || lowerInput.includes("path")) {
      return "There are typically three routes: Conservative (slower, more stable), Balanced (realistic default), and Fast (aggressive savings or location adjustments). Each route shows different purchase years and equity requirements.";
    } else if (lowerInput.includes("job") || lowerInput.includes("career") || lowerInput.includes("income")) {
      return "Career changes impact your timeline significantly. A promotion or salary increase can move your purchase date forward by months or years. Conversely, a career break may extend it. Would you like to simulate different income scenarios?";
    } else if (lowerInput.includes("location") || lowerInput.includes("city") || lowerInput.includes("area")) {
      return "Location is one of the biggest factors in affordability. Different areas have vastly different price ranges. I can help you explore neighborhoods that match your budget and lifestyle preferences.";
    } else if (lowerInput.includes("help") || lowerInput.includes("start")) {
      return "I can help you with: understanding your affordability, explaining how life changes affect your timeline, exploring different routes to homeownership, and interpreting financing options. What would you like to know more about?";
    } else {
      return "That's a great question! While I'm here to help guide you through your homeownership journey, I can best assist with topics like affordability, timeline predictions, life scenario planning, and financing options. How can I help clarify your path forward?";
    }
  };

  return (
    <>
      {/* Floating Orb */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Tooltip */}
        {showTooltip && !isOpen && (
          <div className="absolute bottom-20 right-0 bg-[#1C1C1C] text-white px-4 py-2.5 rounded-xl text-sm whitespace-nowrap shadow-xl animate-fade-in-up">
            Need help planning your path?
            <div className="absolute bottom-[-5px] right-7 w-2.5 h-2.5 bg-[#1C1C1C] transform rotate-45"></div>
          </div>
        )}

        {/* Premium Orb Button */}
        <button
          onClick={toggleChat}
          className={`relative w-14 h-14 rounded-full bg-gradient-to-br from-[#FF6600] to-[#E55A00] text-white shadow-lg 
            flex items-center justify-center
            transition-all duration-500 ease-out
            hover:scale-105 hover:shadow-2xl
            ${isOpen ? "opacity-0 pointer-events-none" : "animate-gentle-breathe"}
            border-2 border-white/20
          `}
          aria-label="Open chat assistant"
        >
          {/* Soft glow effect */}
          <div className="absolute inset-0 rounded-full bg-[#FF6600] blur-md opacity-30 animate-pulse-soft"></div>

          {/* Lightning bolt icon */}
          <div className="relative z-10">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
        </button>
      </div>

      {/* Chat Drawer */}
      <div
        className={`fixed bottom-0 right-0 z-40 w-full sm:w-[420px] transition-all duration-500 ease-out
          ${
            isOpen
              ? "translate-y-0 opacity-100"
              : "translate-y-full opacity-0 pointer-events-none"
          }
        `}
      >
        <div className="bg-white shadow-2xl rounded-t-3xl sm:rounded-l-3xl sm:rounded-tr-none h-[600px] max-h-[85vh] flex flex-col border-t-2 border-l-2 border-r-0 border-[#FF6600]/10 overflow-hidden">
          {/* Premium Header */}
          <div className="relative bg-gradient-to-r from-[#FF6600] via-[#FF7019] to-[#FF6600] text-white px-6 py-5 flex items-center justify-between">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
                </pattern>
                <rect width="100" height="100" fill="url(#grid)" />
              </svg>
            </div>

            <div className="flex items-center gap-3 relative z-10">
              {/* Icon Circle */}
              <div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/25 shadow-lg">
                <svg
                  className="w-5 h-5 animate-pulse-soft"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base tracking-tight">FutureGuide</h3>
                  {/* Live indicator */}
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-soft shadow-lg shadow-green-400/50"></span>
                </div>
                <p className="text-xs text-white/90 font-medium">Your Home Companion</p>
              </div>
            </div>

            {/* Close button in header */}
            <button
              onClick={toggleChat}
              className="relative z-10 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20 transition-all duration-200 hover:scale-105"
              aria-label="Close chat"
            >
              <svg
                className="w-5 h-5 transition-transform duration-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>

          {/* Subtle divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

          {/* Messages with background watermark */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5 bg-gradient-to-b from-gray-50/50 to-white relative">
            {/* Subtle house watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none">
              <svg width="300" height="300" viewBox="0 0 400 400" fill="none">
                <path
                  d="M200 80 L320 180 L320 320 L80 320 L80 180 Z"
                  stroke="#FF6600"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in-up`}
              >
                <div
                  className={`max-w-[82%] px-4 py-3 ${
                    message.role === "user"
                      ? "bg-gradient-to-br from-[#FF6600] to-[#FF7019] text-white rounded-2xl rounded-br-md shadow-md"
                      : "bg-[#FAFAFA] text-[#1C1C1C] rounded-2xl rounded-bl-md border-l-3 border-l-[#FF6600] shadow-sm"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start animate-fade-in-up">
                <div className="bg-[#FAFAFA] text-[#1C1C1C] rounded-2xl rounded-bl-md border-l-3 border-l-[#FF6600] shadow-sm px-5 py-4">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#FF6600] animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-2 h-2 rounded-full bg-[#FF6600] animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-2 h-2 rounded-full bg-[#FF6600] animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Subtle divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

          {/* Premium Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="p-5 bg-white"
          >
            <div className="flex gap-3 items-center">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask me anything about your path..."
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl 
                    focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-transparent focus:bg-white
                    text-sm placeholder:text-gray-400 transition-all duration-200"
                />
              </div>
              
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="w-12 h-12 bg-gradient-to-br from-[#FF6600] to-[#FF7019] text-white rounded-2xl
                  hover:shadow-lg hover:scale-105
                  transition-all duration-200 
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
                  flex items-center justify-center shadow-md"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import * as htmlToImage from "html-to-image";

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
  const [screenshots, setScreenshots] = useState<Record<number, string>>({});
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

  // Listen for external messages (from personal-guide page)
  useEffect(() => {
    const handleOpenChatWithMessage = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const question = customEvent.detail;
      if (question && typeof question === 'string') {
        // Open the chat
        setIsOpen(true);
        
        // Add user message immediately
        const newMessages = [...messages, { role: "user" as const, content: question }];
        setMessages(newMessages);
        
        // Show typing indicator
        setIsTyping(true);

        try {
          // Capture screenshot
          let screenshot = null;
          try {
            // Try to find main content, fallback to body
            const mainElement = document.querySelector('main') || document.body;
            
            // Temporarily hide chatbot to avoid capturing it
            const chatbotElements = document.querySelectorAll('[class*="fixed"][class*="bottom-6"][class*="right-6"]');
            const originalDisplays: string[] = [];
            chatbotElements.forEach((el) => {
              originalDisplays.push((el as HTMLElement).style.display);
              (el as HTMLElement).style.display = 'none';
            });
            
            screenshot = await htmlToImage.toPng(mainElement as HTMLElement, {
              cacheBust: true,
              pixelRatio: 1,
              skipFonts: true,
              preferredFontFormat: 'woff2',
              includeQueryParams: true,
              filter: (node) => {
                // Only filter out the chatbot itself
                if (node instanceof HTMLElement) {
                  // Check if it's part of the chatbot by checking parent chain
                  let current: HTMLElement | null = node;
                  while (current) {
                    const ariaLabel = current.getAttribute('aria-label');
                    if (ariaLabel && (ariaLabel.includes('chat') || ariaLabel.includes('Chat'))) {
                      return false;
                    }
                    current = current.parentElement;
                  }
                }
                return true;
              },
            });
            
            // Restore chatbot visibility
            chatbotElements.forEach((el, i) => {
              (el as HTMLElement).style.display = originalDisplays[i];
            });
            
            // Save screenshot for this message
            if (screenshot) {
              setScreenshots(prev => ({ ...prev, [newMessages.length - 1]: screenshot! }));
              console.log('Screenshot captured successfully');
            }
          } catch (error) {
            console.error('Error capturing screenshot:', error);
            console.log('Continuing without screenshot due to rendering issues');
          }

          // Try to extract profile text
          let profileText: string | null = null;
          try {
            const pCandidates = Array.from(document.querySelectorAll('p')) as HTMLParagraphElement[];
            const found = pCandidates.find((p) => p.textContent && p.textContent.includes('Based on your profile'));
            if (found) profileText = found.textContent || null;
          } catch (err) {
            // ignore
          }

          // Call the AI API
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: newMessages,
              screenshot: screenshot,
              profile: profileText,
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to get response: ${response.status}`);
          }

          // Check if response is streaming
          const contentType = response.headers.get('content-type');
          if (contentType?.includes('text/event-stream')) {
            // Handle streaming response
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let accumulatedContent = '';
            
            // Add placeholder message for streaming
            const assistantMessageIndex = newMessages.length;
            setMessages([...newMessages, { role: "assistant" as const, content: '' }]);
            setIsTyping(false);
            
            if (reader) {
              try {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  
                  const chunk = decoder.decode(value, { stream: true });
                  const lines = chunk.split('\\n');
                  
                  for (const line of lines) {
                    if (line.startsWith('data: ')) {
                      const data = line.slice(6);
                      if (data === '[DONE]') break;
                      
                      try {
                        const parsed = JSON.parse(data);
                        if (parsed.content) {
                          accumulatedContent += parsed.content;
                          setMessages(prev => {
                            const updated = [...prev];
                            updated[assistantMessageIndex] = {
                              role: "assistant" as const,
                              content: accumulatedContent,
                            };
                            return updated;
                          });
                        }
                      } catch (e) {
                        // Skip invalid JSON
                      }
                    }
                  }
                }
              } catch (error) {
                console.error('Streaming error:', error);
              }
            }
          } else {
            // Handle non-streaming response (fallback)
            const data = await response.json();
            
            setIsTyping(false);
            setMessages([
              ...newMessages,
              {
                role: "assistant" as const,
                content: data.message,
              },
            ]);
          }
        } catch (error) {
          console.error('Error getting AI response:', error);
          setIsTyping(false);
          setMessages([
            ...newMessages,
            {
              role: "assistant" as const,
              content: "Entschuldigung, ich habe gerade Verbindungsprobleme. Bitte versuche es in einem Moment erneut.",
            },
          ]);
        }
      }
    };

    window.addEventListener('openChatWithMessage', handleOpenChatWithMessage);

    return () => {
      window.removeEventListener('openChatWithMessage', handleOpenChatWithMessage);
    };
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setShowTooltip(false);
  };

  const clearHistory = () => {
    setMessages([
      {
        role: "assistant",
        content: "Hi! I'm FutureGuide, your companion on the path to homeownership. How can I help you today?",
      },
    ]);
    setScreenshots({});
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isTyping) return;

    // Store input and clear immediately
    const userMessage = trimmedInput;
    setInputValue("");

    // Capture screenshot of the page
    let screenshot = null;
    try {
      // Try to find main content, fallback to body
      const mainElement = document.querySelector('main') || document.body;
      
      // Temporarily hide chatbot to avoid capturing it
      const chatbotElements = document.querySelectorAll('[class*="fixed"][class*="bottom-6"][class*="right-6"]');
      const originalDisplays: string[] = [];
      chatbotElements.forEach((el) => {
        originalDisplays.push((el as HTMLElement).style.display);
        (el as HTMLElement).style.display = 'none';
      });
      
      screenshot = await htmlToImage.toPng(mainElement as HTMLElement, {
        cacheBust: true,
        pixelRatio: 1, // Keep it at 1 for faster processing
        skipFonts: true,
        preferredFontFormat: 'woff2',
        includeQueryParams: true,
        filter: (node) => {
          // Only filter out the chatbot itself
          if (node instanceof HTMLElement) {
            // Check if it's part of the chatbot by checking parent chain
            let current: HTMLElement | null = node;
            while (current) {
              const ariaLabel = current.getAttribute('aria-label');
              if (ariaLabel && (ariaLabel.includes('chat') || ariaLabel.includes('Chat'))) {
                return false;
              }
              current = current.parentElement;
            }
          }
          return true;
        },
      });
      
      // Restore chatbot visibility
      chatbotElements.forEach((el, i) => {
        (el as HTMLElement).style.display = originalDisplays[i];
      });
      
      // Save screenshot for this message
      if (screenshot) {
        setScreenshots(prev => ({ ...prev, [newMessages.length - 1]: screenshot! }));
        console.log('Screenshot captured successfully');
      }
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      console.log('Continuing without screenshot due to rendering issues');
      // Continue without screenshot if capture fails
    }

    // Add user message
    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);

    // Show typing indicator
    setIsTyping(true);

    try {
      // Try to extract a visible profile summary from the page (Personal Guide shows a "Based on your profile:" paragraph)
      let profileText: string | null = null;
      try {
        const pCandidates = Array.from(document.querySelectorAll('p')) as HTMLParagraphElement[];
        const found = pCandidates.find((p) => p.textContent && p.textContent.includes('Based on your profile'));
        if (found) profileText = found.textContent || null;
      } catch (err) {
        // ignore
      }

      // Call the AI API with streaming
      console.log('Sending chat request to /api/chat with', newMessages.length, 'messages');
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages,
          screenshot: screenshot, // Include screenshot
          profile: profileText,
        }),
      });

      console.log('API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`Failed to get response: ${response.status}`);
      }

      // Check if response is streaming
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('text/event-stream')) {
        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = '';
        
        // Add placeholder message for streaming
        const assistantMessageIndex = newMessages.length;
        setMessages([...newMessages, { role: "assistant" as const, content: '' }]);
        setIsTyping(false);
        
        if (reader) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n');
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') break;
                  
                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.content) {
                      accumulatedContent += parsed.content;
                      setMessages(prev => {
                        const updated = [...prev];
                        updated[assistantMessageIndex] = {
                          role: "assistant" as const,
                          content: accumulatedContent,
                        };
                        return updated;
                      });
                    }
                  } catch (e) {
                    // Skip invalid JSON
                  }
                }
              }
            }
          } catch (error) {
            console.error('Streaming error:', error);
          }
        }
      } else {
        // Handle non-streaming response (fallback)
        const data = await response.json();
        console.log('API response received, message length:', data.message?.length);
        
        setIsTyping(false);
        setMessages([
          ...newMessages,
          {
            role: "assistant" as const,
            content: data.message,
          },
        ]);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      setIsTyping(false);
      setMessages([
        ...newMessages,
        {
          role: "assistant" as const,
          content: "Entschuldigung, ich habe gerade Verbindungsprobleme. Bitte versuche es in einem Moment erneut.",
        },
      ]);
    }
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
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
              <circle cx="8.5" cy="10.5" r="1.5"/>
              <circle cx="15.5" cy="10.5" r="1.5"/>
              <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3 .97 4.29L2 22l5.71-.97C9 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" fill="none" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="8" cy="10" r="1"/>
              <circle cx="16" cy="10" r="1"/>
              <path d="M8 13.5c0 2.21 1.79 4 4 4s4-1.79 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            </svg>
          </div>
        </button>
      </div>

      {/* Chat Drawer */}
      <div
        className={`fixed bottom-0 right-0 z-60 w-full sm:w-[420px] transition-all duration-500 ease-out
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
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3 .97 4.29L2 22l5.71-.97C9 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="8" cy="10" r="1"/>
                  <circle cx="16" cy="10" r="1"/>
                  <path d="M8 13.5c0 2.21 1.79 4 4 4s4-1.79 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
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

            <div className="flex items-center gap-2">
              {/* Clear history button */}
              <button
                onClick={clearHistory}
                className="relative z-10 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20 transition-all duration-200 hover:scale-105"
                aria-label="Clear chat history"
                title="Clear chat history"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>

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
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  
                  {/* Show screenshot if available for this message */}
                  {message.role === "user" && screenshots[index] && (
                    <div className="mt-3 pt-3 border-t border-white/20">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs font-medium">Screenshot sent with this message</span>
                      </div>
                      <div className="relative group">
                        <img 
                          src={screenshots[index]} 
                          alt="Screenshot" 
                          className="w-full rounded-lg border border-white/30 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(screenshots[index], '_blank')}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const link = document.createElement('a');
                            link.href = screenshots[index];
                            link.download = `screenshot-${new Date().toISOString()}.png`;
                            link.click();
                          }}
                          className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Download screenshot"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
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
                disabled={!inputValue.trim() || isTyping}
                className="w-12 h-12 bg-gradient-to-br from-[#FF6600] to-[#FF7019] text-white rounded-2xl
                  hover:shadow-lg hover:scale-105
                  transition-all duration-200 
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
                  flex items-center justify-center shadow-md"
              >
                <svg
                  className={`w-5 h-5 transition-transform duration-700 ease-in-out ${inputValue.trim() ? 'rotate-90' : 'rotate-0'}`}
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

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <main className="flex-1 bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto w-full py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div
              className={`space-y-8 transition-all duration-1000 ${
                isLoaded ? "opacity-100 translate-y-0" : "opacity-30 translate-y-8"
              }`}
            >
              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1C1C1C] leading-tight">
                Own a Home One Day?
                <br />
                <span className="text-[#FF6600]">Let's Make That Day Real.</span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-xl">
                Meet your <strong className="text-[#1C1C1C]">Future Home Twin</strong> — a smart
                guide that turns your dreams, data, and life choices into a clear, achievable path
                to homeownership.
              </p>

              {/* CTA Section */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4">
                <Link href="/journey">
                  <button
                    className="group relative px-8 py-4 bg-[#FF6600] text-white font-semibold text-lg rounded-full 
                    transition-all duration-300 ease-out
                    hover:bg-[#FF7A26] hover:scale-[1.02] hover:shadow-lg hover:shadow-orange-200
                    active:scale-[0.98]
                    animate-pulse-once"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Start My Journey
                      <svg
                        className="w-5 h-5 transition-transform group-hover:translate-x-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </span>
                  </button>
                </Link>

                <Link
                  href="/how-it-works"
                  className="text-[#1C1C1C] font-medium text-lg hover:text-[#FF6600] transition-colors underline-offset-4 hover:underline"
                >
                  How it works
                </Link>
              </div>
            </div>

            {/* Right Visual - Animated Home */}
            <div className="relative flex items-center justify-center lg:justify-end">
              <div className="relative w-full max-w-md aspect-square">
                {/* Breathing glow effect */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 bg-[#FF6600] rounded-full blur-3xl opacity-20 animate-breathe"></div>
                </div>

                {/* Main home outline */}
                <svg
                  className="relative z-10 w-full h-full animate-float"
                  viewBox="0 0 400 400"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Animated particles */}
                  <g className="animate-particles">
                    <circle cx="150" cy="250" r="2" fill="#FF6600" opacity="0.6">
                      <animate
                        attributeName="cy"
                        values="350;150;350"
                        dur="4s"
                        repeatCount="indefinite"
                      />
                      <animate attributeName="opacity" values="0;0.8;0" dur="4s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="200" cy="280" r="2" fill="#FF6600" opacity="0.6">
                      <animate
                        attributeName="cy"
                        values="350;120;350"
                        dur="5s"
                        repeatCount="indefinite"
                      />
                      <animate attributeName="opacity" values="0;0.8;0" dur="5s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="250" cy="260" r="2" fill="#FF6600" opacity="0.6">
                      <animate
                        attributeName="cy"
                        values="350;140;350"
                        dur="4.5s"
                        repeatCount="indefinite"
                      />
                      <animate attributeName="opacity" values="0;0.8;0" dur="4.5s" repeatCount="indefinite" />
                    </circle>
                  </g>

                  {/* Home outline */}
                  <path
                    d="M200 80 L320 180 L320 320 L80 320 L80 180 Z"
                    stroke="#FF6600"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-draw-stroke"
                  />

                  {/* Door */}
                  <rect
                    x="160"
                    y="240"
                    width="80"
                    height="80"
                    stroke="#FF6600"
                    strokeWidth="3"
                    fill="none"
                    rx="4"
                  />

                  {/* Window */}
                  <rect
                    x="100"
                    y="200"
                    width="50"
                    height="50"
                    stroke="#FF6600"
                    strokeWidth="3"
                    fill="none"
                    rx="4"
                  />
                  <line x1="125" y1="200" x2="125" y2="250" stroke="#FF6600" strokeWidth="2" />
                  <line x1="100" y1="225" x2="150" y2="225" stroke="#FF6600" strokeWidth="2" />

                  {/* Window 2 */}
                  <rect
                    x="250"
                    y="200"
                    width="50"
                    height="50"
                    stroke="#FF6600"
                    strokeWidth="3"
                    fill="none"
                    rx="4"
                  />
                  <line x1="275" y1="200" x2="275" y2="250" stroke="#FF6600" strokeWidth="2" />
                  <line x1="250" y1="225" x2="300" y2="225" stroke="#FF6600" strokeWidth="2" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-8 sm:gap-12">
            {/* Trust Badge 1 */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                <svg
                  className="w-6 h-6 text-[#FF6600]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-[#1C1C1C]">Expert mortgage insights</p>
            </div>

            {/* Trust Badge 2 */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                <svg
                  className="w-6 h-6 text-[#FF6600]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-[#1C1C1C]">
                Based on real homes & financing data
              </p>
            </div>

            {/* Trust Badge 3 */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                <svg
                  className="w-6 h-6 text-[#FF6600]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-[#1C1C1C]">Backed by Interhyp</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

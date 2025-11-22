'use client';

import { useEffect, useState } from 'react';

export default function Header() {
  const [isTopVisible, setIsTopVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setIsTopVisible(window.scrollY < 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Top Info Bar - verschwindet beim Scrollen */}
      <div
        className={`w-full bg-gray-100 transition-all duration-300 overflow-hidden ${
          isTopVisible ? 'max-h-12' : 'max-h-0'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex justify-end items-center text-sm">
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="flex items-center gap-1 text-gray-700 hover:text-[#FF6600] transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
              </svg>
              <u>Barrierefreier Bereich</u>
            </a>
            <a
              href="tel:+498002001515"
              className="flex items-center gap-2 text-gray-700 hover:text-[#FF6600] transition-colors font-medium"
            >
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
              </svg>
              0800 200 15 15 15
            </a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="w-full bg-white sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <a href="/" className="flex items-center gap-2 group">
                <img
                  src="/interhyp-logo.ico"
                  alt="interhyp"
                  className="w-7 h-7 transition-transform group-hover:scale-105"
                />
                <span className="text-3xl font-bold text-[#1C1C1C]" style={{ fontFamily: "'Arial', 'Helvetica', sans-serif" }}>interhyp</span>
              </a>
            </div>

            {/* Center Navigation */}
            <nav className="hidden md:flex gap-8 items-center">
              <a
                href="https://www.interhyp.de/baufinanzierung/"
                className="text-gray-700 hover:text-[#FF6600] transition-colors font-medium"
              >
                Baufinanzierung
              </a>
              <a
                href="https://www.interhyp.de/immobiliensuche/"
                className="text-gray-700 hover:text-[#FF6600] transition-colors font-medium border-b-2 border-[#FF6600]"
              >
                Immobilien
              </a>
              <a
                href="/personal-guide"
                className="text-gray-700 hover:text-[#FF6600] transition-colors font-medium"
              >
                Personal Guide
              </a>
              <a
                href="https://www.interhyp.de/rechner/"
                className="text-gray-700 hover:text-[#FF6600] transition-colors font-medium"
              >
                Rechner
              </a>
              <a
                href="https://www.interhyp.de/ratgeber/"
                className="text-gray-700 hover:text-[#FF6600] transition-colors font-medium"
              >
                Ratgeber
              </a>
            </nav>

            {/* Right side - CTA and Icons */}
            <div className="flex items-center gap-6">
              <button className="bg-[#FF6600] text-white px-6 py-2 rounded font-bold hover:bg-[#E55A00] transition-colors text-sm">
                Termin vereinbaren
              </button>
              <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

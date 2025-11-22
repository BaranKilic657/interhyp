export default function Header() {
  return (
    <header className="w-full border-b border-gray-100 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <a href="/home" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-[#FF6600] rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold text-[#1C1C1C]">Interhyp</span>
            </a>
          </div>
          <nav className="hidden sm:flex space-x-8">
            <a
              href="/home"
              className="text-[#1C1C1C] font-medium hover:text-[#FF6600] transition-colors"
            >
              Home
            </a>
            <a
              href="/how-it-works"
              className="text-gray-600 hover:text-[#FF6600] transition-colors"
            >
              How it works
            </a>
            <a
              href="/about"
              className="text-gray-600 hover:text-[#FF6600] transition-colors"
            >
              About
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}

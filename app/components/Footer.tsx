export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-100 bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-gray-600 text-sm">
            © {new Date().getFullYear()} Interhyp. All rights reserved.
          </div>
          <div className="flex space-x-6">
            <a
              href="/privacy"
              className="text-gray-600 hover:text-[#FF6600] transition-colors text-sm"
            >
              Privacy Policy
            </a>
            <a
              href="/terms"
              className="text-gray-600 hover:text-[#FF6600] transition-colors text-sm"
            >
              Terms of Service
            </a>
            <a
              href="/contact"
              className="text-gray-600 hover:text-[#FF6600] transition-colors text-sm"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

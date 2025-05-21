export default function Footer() {
  return (
    <footer className="bg-white border-t border-neutral-200 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-neutral-500 text-sm">
            <p>© {new Date().getFullYear()} Cognitive Profiler. All rights reserved.</p>
          </div>
          <div className="flex items-center gap-4">
            <a href="#privacy" className="text-neutral-500 hover:text-primary text-sm transition">Privacy Policy</a>
            <a href="#terms" className="text-neutral-500 hover:text-primary text-sm transition">Terms of Service</a>
            <a href="#contact" className="text-neutral-500 hover:text-primary text-sm transition">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

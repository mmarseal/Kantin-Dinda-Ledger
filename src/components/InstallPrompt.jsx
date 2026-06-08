import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    function handler(e) {
      e.preventDefault();
      setPrompt(e);
      setTimeout(() => setShow(true), 3000);
    }
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
          <img
            src="/icon-192.png"
            alt="Kantin Dinda"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800">
            Pasang di HP kamu
          </p>
          <p className="text-xs text-gray-500">
            Akses Kantin Dinda lebih mudah
          </p>
        </div>

        <button
          onClick={handleInstall}
          className="bg-green-600 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 shrink-0"
        >
          <Download size={14} />
          Pasang
        </button>

        <button
          onClick={() => setShow(false)}
          className="text-gray-400 hover:text-gray-600 shrink-0"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

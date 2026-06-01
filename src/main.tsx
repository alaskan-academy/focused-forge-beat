import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';

// Auto-reload when a new service worker version is available.
// This ensures users always get the latest code without manual cache clearing.
registerSW({
  onNeedRefresh() {
    // New version available — reload silently so the SW activates immediately.
    window.location.reload();
  },
  onOfflineReady() {
    // App ready for offline use — no action needed.
  },
});

createRoot(document.getElementById("root")!).render(<App />);

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Yeh config sirf "bina Docker" (npm run dev) chalane ke liye kaam aati hai.
// Browser /api/... maangta hai, aur Vite us request ko backend (port 5000)
// tak bhej deta hai. Docker mein yehi kaam nginx karta hai (nginx.conf dekho).
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/api": "http://localhost:5000",
    },
  },
});

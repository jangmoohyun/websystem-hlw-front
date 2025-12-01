import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/progress": "http://localhost:3000",
      "/stories": "http://localhost:3000",
      "/problems": "http://localhost:3000",
      "/choices": "http://localhost:3000",
    },
  },
});

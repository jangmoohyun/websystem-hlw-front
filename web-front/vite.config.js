import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

//   https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  
  // 💡아래 base 옵션을 추가합니다
  //  이 설정은 Vite에게 빌드 결과물(index.html) 내부의
  // 모든 자원 경로를 도메인의 루트(/)에서 시작하도록 지시합니다.
  base: '/', 
  server: {
    proxy: {
      "/progress": "http://localhost:3000",
      "/stories": "http://localhost:3000",
      "/problems": "http://localhost:3000",
      "/choices": "http://localhost:3000",
    },
  },
});


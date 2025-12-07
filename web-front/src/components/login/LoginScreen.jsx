// src/components/login/LoginScreen.jsx
import React, { useState } from "react";
import { setTokens } from "../../utils/api.js";

export default function LoginScreen({ onLoginSuccess, onGoToSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://hlw-back-dev-alb-1292379324.ap-northeast-2.elb.amazonaws.com";

  const handleGoogleLogin = () => {
    // 백엔드 구글 로그인 엔드포인트로 리다이렉트
    window.location.href = `${backendUrl}/users/google`;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      // 로그인은 토큰 없이 호출
      const response = await fetch(`${backendUrl}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "로그인에 실패했습니다.");
      }

      if (data.success && data.data.accessToken && data.data.refreshToken) {
        // 액세스 토큰과 리프레시 토큰을 localStorage에 저장
        setTokens(data.data.accessToken, data.data.refreshToken);
        // 로그인 성공 콜백 호출
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      } else {
        throw new Error("로그인 응답 형식이 올바르지 않습니다.");
      }
    } catch (err) {
      setError(err.message || "로그인에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* 배경 이미지 */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{
          backgroundImage: "url('/background/class.png')",
        }}
      />

      {/* 오버레이 - 어둡게 하면서 분위기 주기 */}
      <div className="absolute inset-0 bg-white/25 backdrop-blur-[4px]" />

      {/* 로그인 컨테이너 */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[420px] px-10 py-9 bg-white/35 rounded-[18px] backdrop-blur-[12px] shadow-[0_10px_35px_rgba(0,0,0,0.15)] text-center">
        <h1 className="text-[34px] font-semibold mb-6 text-[#ff5ea7] drop-shadow-[0_0_8px_rgba(255,94,167,0.4)]">
          Hello Love World!
        </h1>

        <form onSubmit={handleLogin}>
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-100/80 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="mb-4 text-left">
            <label className="block mb-1.5 text-sm text-[#444]">이메일</label>
            <input
              type="email"
              placeholder="이메일을 입력하세요…"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-3 rounded-[10px] border border-white/60 bg-white/65 outline-none text-[15px]"
              style={{ 
                color: '#444',
                WebkitTextFillColor: '#444',
                caretColor: '#ff5ea7'
              }}
              disabled={isLoading}
            />
          </div>

          <div className="mb-4 text-left">
            <label className="block mb-1.5 text-sm text-[#444]">비밀번호</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="비밀번호를 입력하세요…"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-3 pr-10 rounded-[10px] border border-white/60 bg-white/65 outline-none text-[15px]"
                style={{ 
                  color: '#444',
                  WebkitTextFillColor: '#444',
                  caretColor: '#ff5ea7'
                }}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-[#444] text-sm"
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 mt-2.5 border-none rounded-xl bg-gradient-to-br from-[#ff8ccf] to-[#ff5ea7] text-white text-[17px] font-semibold cursor-pointer transition-all duration-200 hover:opacity-85 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {isLoading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div className="my-4.5 text-[#666] text-sm">또는</div>

        {/* 구글 로그인 버튼 */}
        <button
          onClick={handleGoogleLogin}
          className="w-full py-3 mb-4 border-none rounded-xl bg-white/80 hover:bg-white/90 text-[#444] text-[17px] font-semibold cursor-pointer transition-all duration-200 hover:-translate-y-0.5 shadow-md flex items-center justify-center gap-2"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google로 로그인
        </button>

        <div className="flex justify-between text-sm">
          <a
            href="#"
            className="text-[#ff5ea7] no-underline hover:underline"
            onClick={(e) => {
              e.preventDefault();
              if (onGoToSignup) {
                onGoToSignup();
              }
            }}
          >
            계정 만들기
          </a>
          <a
            href="#"
            className="text-[#ff5ea7] no-underline hover:underline"
            onClick={(e) => {
              e.preventDefault();
              console.log("비밀번호 찾기");
            }}
          >
            비밀번호 찾기
          </a>
        </div>
      </div>
    </div>
  );
}


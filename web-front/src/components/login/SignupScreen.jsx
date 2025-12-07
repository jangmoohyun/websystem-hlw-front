// src/components/login/SignupScreen.jsx
import React, { useState } from "react";

export default function SignupScreen({ onSignupSuccess, onBackToLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://hlw-back-dev-alb-1292379324.ap-northeast-2.elb.amazonaws.com";

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    // 유효성 검사
    if (!email || !password || !confirmPassword) {
      setError("모든 필드를 입력해주세요.");
      return;
    }

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${backendUrl}/users/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email, 
          password, 
          nickname: nickname || undefined 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error?.message || "회원가입에 실패했습니다.");
      }

      if (data.success) {
        // 회원가입 성공 시 로그인 화면으로 이동
        if (onSignupSuccess) {
          onSignupSuccess();
        }
      } else {
        throw new Error("회원가입 응답 형식이 올바르지 않습니다.");
      }
    } catch (err) {
      setError(err.message || "회원가입에 실패했습니다.");
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

      {/* 회원가입 컨테이너 */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[420px] px-10 py-9 bg-white/35 rounded-[18px] backdrop-blur-[12px] shadow-[0_10px_35px_rgba(0,0,0,0.15)] text-center max-h-[90vh] overflow-y-auto">
        <h1 className="text-[34px] font-semibold mb-6 text-[#ff5ea7] drop-shadow-[0_0_8px_rgba(255,94,167,0.4)]">
          회원가입
        </h1>

        <form onSubmit={handleSignup}>
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-100/80 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="mb-4 text-left">
            <label className="block mb-1.5 text-sm text-[#444]">이메일 *</label>
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
              required
            />
          </div>

          <div className="mb-4 text-left">
            <label className="block mb-1.5 text-sm text-[#444]">비밀번호 *</label>
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
                required
                minLength={6}
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

          <div className="mb-4 text-left">
            <label className="block mb-1.5 text-sm text-[#444]">비밀번호 확인 *</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="비밀번호를 다시 입력하세요…"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-3 pr-10 rounded-[10px] border border-white/60 bg-white/65 outline-none text-[15px]"
                style={{ 
                  color: '#444',
                  WebkitTextFillColor: '#444',
                  caretColor: '#ff5ea7'
                }}
                disabled={isLoading}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-[#444] text-sm"
              >
                {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          <div className="mb-4 text-left">
            <label className="block mb-1.5 text-sm text-[#444]">닉네임</label>
            <input
              type="text"
              placeholder="닉네임을 입력하세요…"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-3.5 py-3 rounded-[10px] border border-white/60 bg-white/65 outline-none text-[15px]"
              style={{ 
                color: '#444',
                WebkitTextFillColor: '#444',
                caretColor: '#ff5ea7'
              }}
              disabled={isLoading}
              maxLength={30}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 mt-2.5 border-none rounded-xl bg-gradient-to-br from-[#ff8ccf] to-[#ff5ea7] text-white text-[17px] font-semibold cursor-pointer transition-all duration-200 hover:opacity-85 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {isLoading ? "가입 중..." : "회원가입"}
          </button>
        </form>

        <div className="mt-6 text-sm">
          <a
            href="#"
            className="text-[#ff5ea7] no-underline hover:underline"
            onClick={(e) => {
              e.preventDefault();
              if (onBackToLogin) {
                onBackToLogin();
              }
            }}
          >
            ← 로그인 화면으로 돌아가기
          </a>
        </div>
      </div>
    </div>
  );
}


// src/App.jsx
import { useState, useEffect } from "react";
import "./App.css";
import LoginScreen from "./components/login/LoginScreen";
import SignupScreen from "./components/login/SignupScreen";
import GameScreen from "./components/game/GameScreen";
import HomeScreen from "./components/home/HomeScreen";
import UserPage from "./components/user/UserPage";
import LoadScreen from "./components/home/LoadScreen.jsx";
import { setTokens, removeTokens, getAccessToken, getRefreshToken, checkAndRefreshToken } from "./utils/api.js";

function App() {
  // login | signup | home | game | userPage
  const [screen, setScreen] = useState("login");
  const [loadedSave, setLoadedSave] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 구글 로그인 콜백 처리
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get("accessToken");
    const refreshToken = urlParams.get("refreshToken");
    const error = urlParams.get("error");
    
    console.log("구글 로그인 콜백 처리:", { 
      hasAccessToken: !!accessToken, 
      hasRefreshToken: !!refreshToken, 
      error 
    });
    
    if (error) {
      console.error("로그인 오류:", error);
      alert("로그인에 실패했습니다. 다시 시도해주세요.");
      // URL에서 에러 파라미터 제거
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (accessToken && refreshToken) {
      console.log("토큰 받음, 홈 화면으로 이동");
      // 액세스 토큰과 리프레시 토큰을 localStorage에 저장
      setTokens(accessToken, refreshToken);
      setIsAuthenticated(true);
      setScreen("home");
      // URL에서 토큰 파라미터 제거
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      // 기존 토큰이 있는지 확인
      const savedAccessToken = getAccessToken();
      const savedRefreshToken = getRefreshToken();
      console.log("기존 토큰 확인:", { 
        hasAccessToken: !!savedAccessToken, 
        hasRefreshToken: !!savedRefreshToken 
      });
      if (savedAccessToken && savedRefreshToken) {
        setIsAuthenticated(true);
        setScreen("home");
        // 토큰 만료 전 자동 갱신 체크
        checkAndRefreshToken();
      } else {
        setScreen("login");
      }
    }
  }, []);

  // 주기적으로 토큰 만료 확인 (5분마다)
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        checkAndRefreshToken();
      }, 5 * 60 * 1000); // 5분마다 체크

      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setScreen("home");
  };

  const handleLogout = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://hlw-back-dev-alb-1292379324.ap-northeast-2.elb.amazonaws.com";
      const accessToken = getAccessToken();
      
      // 백엔드에 로그아웃 요청 (토큰 무효화)
      if (accessToken) {
        await fetch(`${backendUrl}/users/logout`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });
      }
    } catch (error) {
      console.error("로그아웃 요청 실패:", error);
    } finally {
      // 프론트엔드에서 토큰 제거
      removeTokens();
      setIsAuthenticated(false);
      setScreen("login");
    }
  };

  const handleNewGame = () => {
    setLoadedSave(null);
    setScreen("game");
  };

  const handleContinueGame = () => {
      setScreen("load");
  }

    const handleLoadedFromSave = (saveData) => {
        setLoadedSave(saveData);
        setScreen("game");
    };
  
  const handleGoHome = () => {
    setScreen("home");
  };

  const handleGoToSignup = () => {
    setScreen("signup");
  };

  const handleBackToLogin = () => {
    setScreen("login");
  };

  const handleSignupSuccess = () => {
    // 회원가입 성공 시 로그인 화면으로 이동
    setScreen("login");
    alert("회원가입이 완료되었습니다! 로그인해주세요.");
  };

  return (
    <>
      {screen === "login" && (
        <LoginScreen 
          onLoginSuccess={handleLoginSuccess} 
          onGoToSignup={handleGoToSignup}
        />
      )}
      {screen === "signup" && (
        <SignupScreen 
          onSignupSuccess={handleSignupSuccess}
          onBackToLogin={handleBackToLogin}
        />
      )}
      {screen === "home" && (
        <HomeScreen
          onNewGame={handleNewGame}
          onContinue={handleContinueGame}
          onUserPage={() => setScreen("userPage")}
          onSettings={() => console.log("설정")}
          onLogout={handleLogout}
        />
      )}
        {screen === "load" && (
            <LoadScreen
                onLoaded={handleLoadedFromSave}
                onCancel={handleGoHome}
            />
        )}
      {screen === "game" && <GameScreen onGoHome={handleGoHome} initialSave={loadedSave} />}
      {screen === "userPage" && (
        <UserPage onBack={() => setScreen("home")} />
      )}
    </>
  );
}

export default App;

// src/App.jsx
import { useState } from "react";
import "./App.css";
// import LoginScreen from "./components/LoginScreen";
// import HomeScreen from "./components/HomeScreen";
import GameScreen from "./components/game/GameScreen";
import HomeScreen from "./components/home/HomeScreen";

function App() {
  // login | home | game
  const [screen, setScreen] = useState("home");

  // const handleLoginSuccess = () => {
  //   setScreen("home");
  // };

  const handleNewGame = () => {
    setScreen("game");
  };
  const handleGoHome = () => {
    setScreen("home");
  };

  return (
    <>
      {screen === "home" && (
        <HomeScreen
          onNewGame={handleNewGame}
          onContinue={() => console.log("이어하기")}
          onUserPage={() => console.log("유저 페이지")}
          onSettings={() => console.log("설정")}
        />
      )}
      {screen === "game" && <GameScreen onGoHome={handleGoHome} />}
    </>
  );
}

export default App;

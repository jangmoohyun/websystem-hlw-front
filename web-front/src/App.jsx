// src/App.jsx
//import { useState } from "react";
import "./css/App.css";
// import LoginScreen from "./components/LoginScreen";
// import HomeScreen from "./components/HomeScreen";
import GameScreen from "./components/game/GameScreen";

function App() {
  // login | home | game
  // const [screen, setScreen] = useState("login");

  // const handleLoginSuccess = () => {
  //   setScreen("home");
  // };

  // const handleStartGame = () => {
  //   setScreen("game");
  // };

  // const handleBackToHome = () => {
  //   setScreen("home");
  // };

  return (
    <>
      {/* {screen === "login" && (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      )}

      {screen === "home" && <HomeScreen onStartGame={handleStartGame} />} */}

      {/* {screen === "game" && <GameScreen onExitToHome={handleBackToHome} />} */}
      <GameScreen />
    </>
  );
}

export default App;

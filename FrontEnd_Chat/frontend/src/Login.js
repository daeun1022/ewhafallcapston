import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import "./Login.css";
import { setPersistence, browserSessionPersistence } from "firebase/auth";


export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    console.log("clicked");
  
    console.log("email:", email);
    console.log("password:", password);
    console.log("auth:", auth);
  
    setError("");
    try {

      // 로그인 지속성을 session으로 설정
    await setPersistence(auth, browserSessionPersistence);

      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log("로그인 성공:", result);
      const todayKey = new Date().toISOString().split("T")[0].replace(/-/g, "");
      navigate(`/${todayKey}`);
    } catch (err) {
      console.error("로그인 실패:", err);
      setError("이메일 또는 비밀번호가 잘못되었습니다.");
    }
  };

  return (
    <div className="login-container">
      <div className="form-wrapper">
        <h1 className="login-title">ChatBot Diary</h1>

        <label>아이디</label>
        <input
          type="text"
          className="login-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>비밀번호</label>
        <input
          type="password"
          className="login-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="error-message">{error}</p>}

        <div className="login-buttons">
          <button className="login-button" onClick={handleLogin}>로그인</button>
          <button className="login-button" onClick={() => navigate("/signup")}>회원가입</button>
        </div>
      </div>
    </div>
  );
}
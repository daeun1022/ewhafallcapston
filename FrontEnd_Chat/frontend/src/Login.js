import React from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function LoginPage() {
  const navigate = useNavigate();

  return (
    <div className="login-container">
        <div className="form-wrapper">
            <h1 className="login-title">ChatBot Diary</h1>

            <label>아이디</label>
            <input type="text" className="login-input" />

            <label>비밀번호</label>
            <input type="password" className="login-input" />

            <button className="login-button">로그인</button>
        </div>

        <div className="bottom-links">
            <button onClick={() => navigate("/find-id")}>아이디 찾기</button>
            <button onClick={() => navigate("/find-password")}>비밀번호 찾기</button>
            <button onClick={() => navigate("/signup")}>회원가입</button>
        </div>
    </div>
  );
}

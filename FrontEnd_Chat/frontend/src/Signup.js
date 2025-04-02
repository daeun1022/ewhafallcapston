import React, { useState } from "react";
import "./Signup.css";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);

    if (value === "") {
      setEmailError("");
    } else if (!value.includes("@")) {
      setEmailError("올바르지 않은 이메일 주소입니다.");
    } else {
      setEmailError("");
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);

    if (password && value !== password) {
      setPasswordError("비밀번호가 다릅니다. 다시 한번 확인해주세요.");
    } else {
      setPasswordError("");
    }
  };

  return (
    <div className="signup-container">
      <form className="signup-form">
        <h1 className="signup-title">ChatBot Diary</h1>

        {/* 이메일 */}
        <label>이메일 주소</label>
        <div className="input-wrapper">
          <input
            type="email"
            className="signup-input"
            value={email}
            onChange={handleEmailChange}
          />
          <button type="button" className="side-button">이메일 보내기</button>
        </div>
        {emailError && <div className="error-message">{emailError}</div>}

        {/* 아이디 */}
        <label>아이디</label>
        <div className="input-wrapper">
          <input
            type="text"
            className="signup-input"
            value={id}
            onChange={(e) => setId(e.target.value)}
          />
          <button type="button" className="side-button">중복 확인</button>
        </div>

        {/* 비밀번호 */}
        <label>비밀번호</label>
        <input
          type="password"
          className="signup-input"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (confirmPassword && confirmPassword !== e.target.value) {
              setPasswordError("비밀번호가 다릅니다. 다시 한번 확인해주세요.");
            } else {
              setPasswordError("");
            }
          }}
        />

        {/* 비밀번호 재확인 */}
        <label>비밀번호 재확인</label>
        <input
          type="password"
          className="signup-input"
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
        />
        {passwordError && <div className="error-message">{passwordError}</div>}

        <button type="submit" className="signup-submit">회원가입</button>
      </form>
    </div>
  );
}

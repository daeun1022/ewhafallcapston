import React, { useState } from "react";
import "./Signup.css";
//Auth 관련 import
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  //회원가입 성공 메시지용 상태추가
  const [SignupSuccess, setSignupSuccess] = useState("");

  //Firebase 인증객체
  const auth = getAuth();

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

   // ✅ 회원가입 처리 함수 추가 (기존엔 없었음)
   const handleSignup = async (e) => {
    e.preventDefault();

    // 🔧 기본 입력값 검증
    if (!email || !password || !confirmPassword) {
      setEmailError("모든 항목을 입력해주세요.");
      return;
    }

    // 🔧 비밀번호 일치 여부 확인
    if (password !== confirmPassword) {
      setPasswordError("비밀번호가 다릅니다. 다시 한번 확인해주세요.");
      return;
    }

    // 🔧 Firebase 회원가입 시도
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setSignupSuccess("회원가입이 완료되었습니다!");

      // 🔧 입력 필드 초기화
      setEmail("");
      setId("");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      // 🔧 오류별 메시지 처리
      if (error.code === "auth/email-already-in-use") {
        setEmailError("이미 사용 중인 이메일입니다.");
      } else if (error.code === "auth/weak-password") {
        setPasswordError("비밀번호는 최소 6자 이상이어야 합니다.");
      } else {
        setEmailError("회원가입에 실패했습니다. 다시 시도해주세요.");
      }
    }
  };

  return (
    <div className="signup-container">

       {/* ✅ 기존 form 태그에 handleSignup 연결 */}
       <form className="signup-form" onSubmit={handleSignup}>
       {/*윗줄 변경 전 코드... </form><form className="signup-form">*/}
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
        
         {/* ✅ 회원가입 성공 메시지 표시 */}
         {SignupSuccess && <div className="success-message">{SignupSuccess}</div>}
      </form>
    </div>
  );
}

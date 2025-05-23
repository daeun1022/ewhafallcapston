import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Angry, Annoyed, Laugh, Smile, Frown, Meh } from "lucide-react";
import "./Diary.css";
import { doc, getDoc } from 'firebase/firestore'; 
import { db } from './firebase'; 

export default function DiaryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [summary, setSummary] = useState("");
  const [mainemotion, setMainEmotion] = useState("");
  const [mainemotiontext, setMainEmotionText] = useState("");
  const [subemotion, setSubEmotion] = useState("");
  const [loading, setLoading] = useState(true); 
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  const moodIcons = {
    Angry: <Angry className="icon emotion-icon" />,
    Annoyed: <Annoyed className="icon emotion-icon" />,
    Laugh: <Laugh className="icon emotion-icon" />,
    Smile: <Smile className="icon emotion-icon" />,
    Frown: <Frown className="icon emotion-icon" />,
    Meh: <Meh className="icon emotion-icon" />,
  };

  const getTodayKey = () => {
    const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
    return kst.toISOString().split("T")[0];
  };

  const todayKey = getTodayKey();

  // 현재 URL에서 date 파라미터 가져오기
  const extractDateFromQuery = () => {
    const params = new URLSearchParams(location.search);
    return params.get("date") || todayKey;
  };

  const queryDate = extractDateFromQuery();

  const getFormattedKoreanDate = (dateStr) => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 0-indexed
    const day = date.getDate();
    const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    return `${year}년 ${month}월 ${day}일 (${weekday})`;
  };

  useEffect(() => {
  const fetchMessages = async () => {
    try {
      // Firestore에서 ChatMessage 컬렉션을 참조하여 해당 날짜에 맞는 문서를 가져옵니다
      const docRef = doc(db, "chatMessagesByDate", queryDate); // 날짜를 키로 사용
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        console.log("해당 날짜의 메시지가 없습니다.");
        setLoading(false);
        return;
      }

      const messages = docSnap.data()?.messages;
      if (!messages || messages.length === 0) {
        return;
      }

      const content = messages.map(m => m.text).join("\n");

      const fetchSummary = async () => {
        try {
          console.log("fetchSummary 호출됨");
          setLoading(true);
          const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: "gpt-4o",
              messages: [
                {
                  role: "system",
                  content: `${getFormattedKoreanDate(queryDate)}의 대화를 바탕으로 실제 일기처럼 요약해줘.
                  - 사용자의 전체 대화에서 감정과 관련된 주요 사건 3개 이하만 선택해서 요약해.
                  - 사건은 시간 순서대로 나열하되, 감정의 흐름이 자연스럽게 드러나야 해.
                  - 절대로 모든 사건을 다 나열하지 말고, 감정의 원인과 변화가 드러나는 핵심 사건만 선택해.
                  - 문장은 '~했다', '~였다' 식으로 자연스럽고 서술형 일기처럼 작성해.
                  - 너무 딱딱하거나 교과서적인 표현, 이모지, 말줄임표는 사용하지 마.
                  - 전체적으로 감정 중심이되, 핵심 사건의 전개가 드러나는 간결한 요약이 되도록 해줘.`
                },  
                { role: "user", content }
              ],
            }),
          });

          const data = await res.json();
          console.log("GPT 요약 응답:", data);
          const aiSummary = data.choices?.[0]?.message?.content?.trim();
          setSummary(aiSummary || "요약 실패");
        } catch (err) {
          console.error("요약 오류:", err);
          setSummary("요약 실패");
        } finally {
          setLoading(false);
        }
      };

      const fetchMainEmotion = async () => {
        try {
          const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: "gpt-4o",
              messages: [
                {
                  role: "system",
                  content: `대화에서 사용자 감정을 하나 뽑아줘. (Angry, Annoyed, Laugh, Smile, Frown, Meh 중에서).
                  - 감정을 적을 때 이 감정이 얼마나 강하게 느껴졌는지 100점 만점 중 몇 점을 가지는 지로 표현해줘.
                  - 표현 형식은 감정 이름 (점수) 이런 식이야.`,
                },
                { role: "user", content },
              ],
            }),
          });

          const data = await res.json();
          const mainEmotionStr = data.choices?.[0]?.message?.content?.trim();

          const detectedEmotion = ["Angry", "Annoyed", "Laugh", "Smile", "Frown", "Meh"].find(
            emotion => mainEmotionStr?.includes(emotion)
          );

          setMainEmotion(detectedEmotion || "메인 감정 분석 실패");
          if (detectedEmotion) {
            await fetchMainEmotionText(detectedEmotion, content);
          }
        } catch (err) {
          console.error("메인 감정 분석 오류:", err);
          setMainEmotion("메인 감정 분석 실패");
        }
      };

      const fetchMainEmotionText = async (emotion, content) => {
        try {
          const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: "gpt-4o",
              messages: [
                {
                  role: "system",
                  content: `사용자의 핵심 감정은 ${emotion}야.
                  - "오늘의 감정은 ${emotion}야."로 시작해 줘.
                  - 처음엔 아침이나 하루 시작할 때 감정 상태가 어땠는지 간단히 말해 줘.
                  - 그다음엔 어떤 사건이나 상황이 겹치면서 감정이 더 심해졌는지 이어서 설명해 줘.
                  - 마지막 문장은 그 감정을 느끼면서 들었던 생각이나 마음의 여운을 적어 줘.
                  - 예: "오늘의 감정은 Frown이야. 아침부터 마음이 괜히 가라앉은 상태였는데, 비 오는 출근길과 직장에서의 외로움이 겹치면서 더 우울해진 것 같아. 하루 종일 '어차피 혼자야'라는 생각에 사로잡혀 있었거든."
                  - 문장은 총 3문장으로 구성해 줘.
                  - 이모지나 말줄임표는 쓰지 말고, 문장은 매끄럽고 자연스럽게 이어 줘.`,
                },
                { role: "user", content },
              ],
            }),
          });

          const data = await res.json();
          const text = data.choices?.[0]?.message?.content?.trim();
          setMainEmotionText(text || "메인 감정 텍스트 분석 실패");
        } catch (err) {
          console.error("메인 감정 텍스트 분석 오류:", err);
          setMainEmotionText("메인 감정 텍스트 분석 실패");
        }
      };

      const fetchSubEmotion = async () => {
        try {
          const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: "gpt-4o",
              messages: [
                {
                  role: "system",
                  content: `아래 대화 내용에서 사용자가 경험한 감정을 분석해서, 핵심 감정을 제외한 부가 감정 4가지를 감정 단어와 강도(0~100점)로 함께 추출해줘.
                  - 감정은 서로 유사하지 않게 다양하게 선정해줘. 예: '피로'와 '무기력'은 비슷하므로 둘 중 하나만.
                  - 감정 단어만 나열하고, 설명이나 이모지는 포함하지 마.
                  - 점수는 사용자가 그 감정을 어느 정도로 느꼈는지를 기준으로 판단해.
                  - 형식은 반드시 다음과 같아: 감정 (점수), 감정 (점수), 감정 (점수), 감정 (점수)
                  - 반드시 핵심 감정(예: Frown 등)은 포함하지 말고 제외해줘.
                  - 감정 후보 예시: 피로, 불안, 우울, 외로움, 당황, 억울, 기대감, 초조함, 서운함, 안도감 등 일상적인 감정어 위주로 선택해.`,
                },
                { role: "user", content },
              ],
            }),
          });

          const data = await res.json();
          const text = data.choices?.[0]?.message?.content?.trim();
          setSubEmotion(text || "서브 감정 분석 실패");
        } catch (err) {
          console.error("서브 감정 분석 오류:", err);
          setSubEmotion("서브 감정 분석 실패");
        }
      };

      // 모든 fetch 함수 실행
      await fetchSummary();
      await fetchMainEmotion();
      fetchSubEmotion();

    } catch (err) {
      console.error("메시지 불러오기 오류:", err);
    }
  };

  fetchMessages();
}, [queryDate]);

  return (
    <div className="diary-wrapper">
      <div
        className="diary-fixed-title"
        onClick={() => navigate("/today")}
        tabIndex={0}
        role="button"
        onKeyDown={(e) => e.key === "Enter" && navigate("/today")}
      >
        ChatBot Diary
      </div>

      <div className="diary-background">
        <div className="diary">
          <div className="spring">
            {Array.from({ length: 12 }).map((_, i) => (
              <div className="spring-ring" key={i}></div>
            ))}
          </div>
          <div className="diary-summary">
            <div className="diary-summary-date">{getFormattedKoreanDate(queryDate)}</div>
            <div className="diary-summary-text">{loading ? "일기쓰는 중..." : summary}</div>
            {!loading && (
              <div className="diary-summary-main-emotion">
                {moodIcons[mainemotion]}
                <span style={{ marginLeft: "8px" }}>{mainemotiontext}</span>
              </div>
            )}
            {!loading && (
            <div className="diary-summary-sub-emotion">
              <div className="diary-subemotion-badges">
                {subemotion.split(',').map((emotion, idx) => (
                  <span key={idx} className="diary-badge">#{emotion.trim()}</span>
                ))}
              </div>
            </div>
          )}
          </div>
          <div className="diary-feedback-section">
            <p className="diary-feedback-guide">
              일기 요약 내용 혹은 감정 분석 내용이 틀렸다면 직접 수정해보세요
            </p>
            {showFeedback && !feedbackSent && (
              <textarea
                className="diary-feedback-textarea"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="수정하고 싶은 내용을 적어주세요."
              />
            )}
            <button className="diary-feedback-button" onClick={async() => {
                if (!showFeedback) {
                  // 첫 번째 클릭
                  setShowFeedback(true);
                } else {
                  // 두 번째 클릭

                    // 추가: 피드백 내용이 비어있으면 전송하지 않고 경고
                    if (!feedbackText.trim()) {
                      alert("피드백 내용을 입력해주세요.");
                      return;
                    }
                    
                    
                    try {
                      // OpenAI API에 보낼 메시지 포맷 생성
                      const chatHistory = [
                        { role: "user",
                          content: feedbackText,
                        }
                      ];

                      // fetch 요청
                      const response = await fetch("https://api.openai.com/v1/chat/completions", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
                        },
                        body: JSON.stringify({
                          model: "gpt-4o",
                          messages: chatHistory,
                        }),
                      });

                      if (!response.ok) {
                        throw new Error(`API 요청 실패: ${response.statusText}`);
                      }

                      const data = await response.json();
                      console.log("OpenAI 응답:", data);
                        } catch (error) {
                          console.error("피드백 전송 실패:", error);
                          alert("피드백 전송에 실패했습니다. 다시 시도해주세요.");  
                        }

                  alert("피드백이 전송되었습니다");
                  setFeedbackSent(true);
                  setShowFeedback(false);
                }
              }}
              disabled={feedbackSent}>
              피드백
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
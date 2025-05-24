import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Angry, Annoyed, Laugh, Smile, Frown, Meh } from "lucide-react";
import "./Diary.css";
import { doc, setDoc, getDoc } from 'firebase/firestore'; 
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
  const [feedbackAlreadySent, setFeedbackAlreadySent] = useState(false);

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

  const saveFeedbackToFirebase = async (date, feedback) => {
    try {
      const feedbackRef = doc(db, "feedbackByDate", date);
      await setDoc(feedbackRef, { feedback }, { merge: true });
      console.log("피드백 저장 성공");
    } catch (err) {
      console.error("피드백 저장 실패:", err);
    }
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

        const feedbackRef = doc(db, "feedbackByDate", queryDate);
        const feedbackSnap = await getDoc(feedbackRef);
        const savedFeedback = feedbackSnap.exists() ? feedbackSnap.data().feedback : "";
        setFeedbackText(savedFeedback); // 기존 상태에 저장
        setFeedbackAlreadySent(!!savedFeedback); // 피드백이 존재하면 true로 설정 (버튼 비활성화)

        const fetchSummary = async (content, feedbackTextFromFirebase = "") => {
          try {
            setLoading(true);
            console.log("📥 요약 요청 중. 피드백 포함 여부:", !!feedbackTextFromFirebase);
            
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
                    - 전체적으로 감정 중심이되, 핵심 사건의 전개가 드러나는 간결한 요약이 되도록 해줘.
                    - "user" 역할의 메시지만 사용해. "assistant" 역할의 메시지는 절대로 사용하면 안 돼.
                    - 사용자의 입력 내용을 그대로 기반으로 해야 하며, 추측하거나 창작해서는 안 돼.
                    - 예를 들어, 사용자가 "오늘 너무 졸려"라고만 입력했다면, "오늘 졸렸다"고만 표현해야 하며, "숙제를 하느라 졸렸다"처럼 이유를 추측해서 넣어선 절대 안돼.`,
                  },  
                  { role: "user",
                    content : `🗣 사용자 대화: ${content} 
                    ${feedbackTextFromFirebase ? `사용자가 이전에 남긴 피드백: "${feedbackTextFromFirebase}". 이 피드백을 참고하여 요약 내용을 더 자연스럽게 보완하기.` : ""}`
                  },
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
                    - 단, 사용자 입력이 짧거나 사건이 충분히 명확하지 않다면 무리하게 하루 전체를 요약하지 말고, 입력된 내용에 기반해 간결하고 자연스럽게 작성해 줘.
                    - 예: "오늘의 감정은 Frown이야. 아침부터 마음이 괜히 가라앉은 상태였는데, 비 오는 출근길과 직장에서의 외로움이 겹치면서 더 우울해진 것 같아. 하루 종일 '어차피 혼자야'라는 생각에 사로잡혀 있었거든."
                    - 문장은 최대 3문장으로 구성해 줘.
                    - 이모지나 말줄임표는 쓰지 말고, 문장은 매끄럽고 자연스럽게 이어 줘.
                    - "user"의 입력이 짧으면 그 입력만을 사용해서 짧게 적어도 돼. 절대로 멋대로 내용을 창작해서는 안 돼.
                    - "user" 역할의 메시지만 사용해. "assistant" 역할의 메시지는 절대로 사용하면 안 돼.
                    - 사용자의 입력 내용을 그대로 기반으로 해야 하며, 추측하거나 창작해서는 안 돼.
                    - 예를 들어, 사용자가 "오늘 너무 졸려"라고만 입력했다면, "오늘 졸렸다"고만 표현해야 하며, "숙제를 하느라 졸렸다"처럼 이유를 추측해서 넣어선 절대 안돼.
                    - user의 입력이 "피곤하다" 라고 했다면, "피곤하다" 만 표현해야지 "머리가 깨질 것 같았다" 같이 오버해서 적지 마.`,
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
        await fetchSummary(content, savedFeedback); // 여기서 바로 전달
        await fetchMainEmotion(content);
        fetchSubEmotion(content);

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
            <button className="diary-feedback-button" disabled={feedbackAlreadySent || feedbackSent} onClick={async() => {
                if (!showFeedback) {
                  // 첫 번째 클릭
                  setShowFeedback(true);
                }
                
                else {
                  // 두 번째 클릭
                  // 추가: 피드백 내용이 비어있으면 전송하지 않고 경고
                  if (!feedbackText.trim()) {
                    alert("피드백 내용을 입력해주세요.");
                    return;
                  }

                  try {
                    await saveFeedbackToFirebase(queryDate, feedbackText); // 🔹 저장
                    alert("피드백이 저장되었습니다.");
                    setFeedbackSent(true);
                    setShowFeedback(false);
                  }
                  
                  catch (err) {
                    alert("피드백 저장 중 오류가 발생했습니다.");
                  }
                }}}>
              피드백
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Diary.css";

export default function DiaryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [summary, setSummary] = useState("");
  const [emotion, setEmotion] = useState("");
  const [loading, setLoading] = useState(true); // 로딩 상태 추가

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
    const stored = localStorage.getItem("chatMessagesByDate");
    if (!stored) return;

    const parsed = JSON.parse(stored);
    const messages = parsed[queryDate];
    if (!messages || messages.length === 0) return;

    const content = messages.map(m => m.text).join("\n");

    const fetchSummary = async () => {
      try {
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
                - 대화에서 사용자가 느낀 주요 감정을 하나 정하고, 그 감정이 형성되기까지의 **사건들을 시간 순서대로** 정리해줘.
                - 감정의 변화나 흐름이 드러나도록 서술해줘.
                - 문장은 실제 일기처럼 자연스럽게 '~했다', '~였다' 식으로 마무리할 것.
                - 전체적으로 감정 중심이지만, 대화 속 **사건의 순서와 전개**가 잘 드러나도록 요약할 것.
                - 사용자의 대화 내용 중 가장 강하게 드러난 감정을 중심으로 써줘.
                - 하루의 모든 사건을 나열하지마. 
                - 채팅을 통해 사용자에게 일어난 사건들을 나열해본 뒤 그 중 감정과 관련된 중요한 사건을 위주로 3개 미만으로 선택해 그 사건들 위주로 요약해.
                - 말투는 실제 일기처럼 자연스럽고 서술형으로, "~했다", "~였다" 형식으로 작성해줘.
                - 이모지나 이모티콘은 절대 사용하지 말고, 너무 딱딱하거나 교과서적인 표현도 피할 것.
                - 요약은 간결하고 감정 중심으로, 하루를 돌아보는 느낌으로 작성해줘.`
              },
              {
                role: "user",
                content,
              },
            ],
          }),
        });

        const data = await res.json();
        const aiSummary = data.choices?.[0]?.message?.content?.trim();
        setSummary(aiSummary || "요약 실패");
      } catch (err) {
        console.error("요약 오류:", err);
        setSummary("요약 실패");
      } finally {
        setLoading(false); // 완료되든 실패하든 로딩 끝
      }
    };

    const fetchEmotion = async () => {
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
              { role: "system", 
                content: `다음 대화에서 사용자 감정을 하나 이상 추출해 나열해줘.
                - 가장 핵심적인 감정을 먼저 알려줘. 오늘의 핵심 감정은 OO 입니다. 라는 형식으로 써줘.
                - 그리고 줄바꿈 후 그 다음으로 격렬하게 느껴진 감정 총 4개를 순서대로 적어줘.
                - 이모지나 설명 없이 감정 단어만 콤마로 나열해줘.
                - 감정을 적을 때 이 감정이 얼마나 강하게 느껴졌는지 100점 만점 중 몇 점을 가지는 지로 표현해줘.
                - 표현 형식은 감정 이름 (점수), 감정 이름 (점수) 이런 식이야.` },
              { role: "user", content }
            ]
          })
        });

        const data = await res.json();
        const emotionText = data.choices?.[0]?.message?.content?.trim();
        setEmotion(emotionText || "감정 분석 실패");
      } catch (err) {
        console.error("감정 분석 오류:", err);
        setEmotion("감정 분석 실패");
      }
    };

    fetchSummary();
    fetchEmotion();
  }, [queryDate]);

  return (
    <div className="diary-wrapper">
      <div
        className="diary-fixed-title"
        onClick={() => navigate("/")}
        tabIndex={0}
        role="button"
        onKeyDown={(e) => e.key === "Enter" && navigate("/")}
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
            <div className="diary-summary-emotion">{loading ? "" : emotion}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

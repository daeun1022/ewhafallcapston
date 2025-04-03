import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Diary.css";

export default function DiaryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [summary, setSummary] = useState("");

  const getTodayKey = () => {
    const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
    return kst.toISOString().split("T")[0];
  };

  const todayKey = getTodayKey();

  // 현재 URL에서 date 파라미터 가져오기
  const extractDateFromQuery = () => {
    const params = new URLSearchParams(location.search);
    return params.get("date");
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

  // 오늘 날짜가 아니면 자동으로 오늘로 리디렉트
  useEffect(() => {
    if (queryDate !== todayKey) {
      navigate(`/diary?date=${todayKey}`, { replace: true });
    }
  }, [queryDate, todayKey, navigate]);

  useEffect(() => {
    const stored = localStorage.getItem("chatMessagesByDate");
    if (!stored) return;

    const parsed = JSON.parse(stored);
    const messages = parsed[todayKey];
    if (!messages || messages.length === 0) return;

    const content = messages.map(m => m.text).join("\n");

    const fetchSummary = async () => {
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
                content: `${getFormattedKoreanDate(todayKey)}의 대화 내용을 자연스럽고 감정 중심으로 요약해줘. 
                - 요약은 간결하고 부드러운 말투로, 감정과 분위기를 중심으로 작성할 것.
                - 이모지와 이모티콘은 절대 사용하지 말 것.
                - 너무 딱딱하거나 교과서적인 표현은 피하고, 실제 친구에게 말하듯 편안하게 써줘.`,
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
      }
    };

    fetchSummary();
  }, [todayKey]);

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
          <div className="diary-summary-text">{summary}</div>
        </div>
      </div>
    </div>
  );
}

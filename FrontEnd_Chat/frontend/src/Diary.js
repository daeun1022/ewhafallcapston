// Diary.js
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Diary.css";

export default function DiaryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [summary, setSummary] = useState("");

  const extractDateFromPath = () => {
    const match = location.pathname.match(/\/(\d{8})$/);
    if (match) {
      const raw = match[1];
      return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
    }
    return new Date().toISOString().split("T")[0];
  };

  const dateKey = extractDateFromPath();

  useEffect(() => {
    const stored = localStorage.getItem("chatMessagesByDate");
    if (!stored) return;

    const parsed = JSON.parse(stored);
    const messages = parsed[dateKey];
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
                content: "다음 대화를 한 문단으로 요약해줘. 감정과 분위기를 포함해서 간결하고 자연스럽게 써줘. 이모지는 절대 쓰지 마.",
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
        if (aiSummary) setSummary(aiSummary);
        else setSummary("요약 실패");
      } catch (err) {
        console.error("요약 오류:", err);
        setSummary("요약 실패");
      }
    };

    fetchSummary();
  }, [dateKey]);

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

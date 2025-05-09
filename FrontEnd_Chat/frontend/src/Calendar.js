// Calendar.js
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Angry, Annoyed, Laugh, Smile, Frown, Meh } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import "./Calendar.css";
import LineChart from "./LineChart.js";

export default function CalendarPage() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const navigate = useNavigate();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay(); // 0: Sunday
  const [monthlyEmotionCounts, setMonthlyEmotionCounts] = useState({});
  const [selectedEmotion, setSelectedEmotion] = useState("Meh");

  const goToPrevMonth = () => {
    const prevMonth = new Date(year, month - 1);
    setCurrentDate(prevMonth);
  };

  const goToNextMonth = () => {
    const nextMonth = new Date(year, month + 1);
    setCurrentDate(nextMonth);
  };

  const isToday = (day) => {
    return (
      year === today.getFullYear() &&
      month === today.getMonth() &&
      day === today.getDate()
    );
  };

  const handleDateClick = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    navigate(`/${dateStr.replace(/-/g, "")}`);
  };

  const [chatLog, setChatLog] = useState([]);

  const weeklyEmotionCounts = useMemo(() => {
    const counts = [0, 0, 0, 0, 0]; // 1~5주차
  
    chatLog.forEach(log => {
      if (!log.date || log.mood !== selectedEmotion) return;
  
      const date = new Date(log.date);
      if (date.getFullYear() !== year || date.getMonth() !== month) return;
  
      const day = date.getDate();
      const weekIndex = Math.floor((firstDay + day - 1) / 7); // 0~4
      counts[weekIndex]++;
    });
  
    return counts;
  }, [chatLog, selectedEmotion, year, month, firstDay]);

  const ChartData = useMemo(() => {
    return [{
      id: selectedEmotion,
      data: weeklyEmotionCounts.map((count, i) => ({
        x: `${i + 1}주차`,
        y: count
      }))
    }];
  }, [weeklyEmotionCounts, selectedEmotion]);

  useEffect(() => {
    const fetchChatLog = async () => {
      const snapshot = await getDocs(collection(db, "chatLog"));
      const logs = snapshot.docs.map(doc => doc.data());
      setChatLog(logs);
  
      // 감정 통계 계산
      const currentMonth = `${year}-${String(month + 1).padStart(2, "0")}`;
      const counts = {
        Angry: 0,
        Annoyed: 0,
        Laugh: 0,
        Smile: 0,
        Frown: 0,
        Meh: 0
      };
  
      logs.forEach(log => {
        if (log.date?.startsWith(currentMonth) && counts.hasOwnProperty(log.mood)) {
          counts[log.mood]++;
        }
      });
  
      setMonthlyEmotionCounts(counts);
    };
  
    fetchChatLog();
  }, [year, month]);

  const emotionByDate = useMemo(() => {
    const map = {};
    chatLog.forEach(entry => {
      map[entry.date] = entry.mood;
    });
    return map;
  }, [chatLog]);

  const weeks = [];
  let days = [];

  const moodIcons = {
    Angry: <Angry className="icon calendar-icon" />,
    Annoyed: <Annoyed className="icon calendar-icon" />,
    Laugh: <Laugh className="icon calendar-icon" />,
    Smile: <Smile className="icon calendar-icon" />,
    Frown: <Frown className="icon calendar-icon" />,
    Meh: <Meh className="icon calendar-icon" />,
  };

  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="calendar-day empty" />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const emotion = emotionByDate[dateStr];
  
    days.push(
      <div
        key={d}
        className={`calendar-day ${isToday(d) ? "today" : ""}`}
        onClick={() => handleDateClick(d)}
      >
        <span className="calendar-date">{d}</span>
        {emotion && moodIcons[emotion]}
      </div>
    );
  }

  for (let i = 0; i < days.length; i += 7) {
    weeks.push(
      <div key={`week-${i}`} className="calendar-week">
        {days.slice(i, i + 7)}
      </div>
    );
  }

  console.log("ChartData:", ChartData);

  return (
    <div className="calendar-page">
      <div className="calendar-title" onClick={() => navigate("/today")}>ChatBot Diary</div>
      <div className="calendar-container">
        <div className="calendar-left-page">
          <div className="calendar-header">
            <button onClick={goToPrevMonth} className="calendar-arrow">◀</button>
            <h1>{year}년 {month + 1}월</h1>
            <button onClick={goToNextMonth} className="calendar-arrow">▶</button>
          </div>

          <div className="calendar-weekdays">
            <div style={{ color: "red" }}>일</div>
            <div>월</div>
            <div>화</div>
            <div>수</div>
            <div>목</div>
            <div>금</div>
            <div style={{ color: "blue" }}>토</div>
          </div>

          <div className="calendar-grid">
            {weeks}
          </div>
        </div>
      
        <div className="calendar-right-page">
          <div className="chart-and-summary">
            <div className="chart-wrapper">
              <select
              value={selectedEmotion}
              onChange={(e) => setSelectedEmotion(e.target.value)}
              style={{ marginBottom: "1rem", padding: "0.5rem" }}>
                {["Angry", "Annoyed", "Laugh", "Smile", "Frown", "Meh"].map(emotion => (
                <option key={emotion} value={emotion}>
                  {emotion}
                </option>
              ))}
              </select>
              <LineChart data={ChartData}/>
            </div>
            <div className="calendar-monthly-emotions">
              <h3>이번 달 감정 요약</h3>
              <ul>
                {Object.entries(monthlyEmotionCounts).map(([emotion, count]) => (
                  <li key={emotion} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>{moodIcons[emotion]}</span>
                    <span>{emotion}: {count}회</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="calendar-summary-footer">
            <h4>이번 달 요약</h4>
            <p>🏆 가장 많이 느낀 감정: aaa</p>
            <p>📊 평균 감정: bbb</p>
          </div>
        </div>
      </div> 
    </div>
  );
}
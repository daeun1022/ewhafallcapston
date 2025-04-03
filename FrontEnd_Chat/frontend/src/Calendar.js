// Calendar.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Calendar.css";

export default function CalendarPage() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const navigate = useNavigate();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay(); // 0: Sunday

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

  const weeks = [];
  let days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="calendar-day empty" />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    days.push(
      <div key={d} className={`calendar-day ${isToday(d) ? "today" : ""}`} onClick={() => handleDateClick(d)}>
        <span className="calendar-date">{d}</span>
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

  return (
    <div className="calendar-container">

      <div className="calendar-title" onClick={() => navigate("/")}>ChatBot Diary</div>
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
  );
}
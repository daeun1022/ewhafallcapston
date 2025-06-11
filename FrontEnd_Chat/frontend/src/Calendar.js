// Calendar.js
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Angry, Annoyed, Laugh, Smile, Frown, Meh } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase.js";
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
  const [streakKeywords, setStreakKeywords] = useState("");

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
  const [chatMessagesByDate, setChatMessagesByDate] = useState({});

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

  const emotionStreak = useMemo(() => {
    const sortedLogs = [...chatLog]
    .filter(log => {
      const d = new Date(log.date);
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let maxStreak = 1;
    let currentStreak = 1;
    let streakMood = null;
    let startDate = null;
    let endDate = null;
    let tempStart = sortedLogs[0]?.date || null;

    for (let i = 1; i < sortedLogs.length; i++) {
      const prev = sortedLogs[i - 1];
      const curr = sortedLogs[i];
      if (!prev.date || !prev.mood || !curr.date || !curr.mood) continue;

      const prevDate = new Date(prev.date);
      const currDate = new Date(curr.date);
      const diff = (currDate - prevDate) / (1000 * 60 * 60 * 24); // days

      if (curr.mood === prev.mood && diff === 1) {
        currentStreak++;
      } else {
        currentStreak = 1;
        tempStart = curr.date; // 새 시작점
      }

      if (currentStreak > maxStreak || (currentStreak === maxStreak && new Date(curr.date) > new Date(endDate))) {
        maxStreak = currentStreak;
        streakMood = curr.mood;
        startDate = tempStart;
        endDate = curr.date;
      }
    }
  
    if (!startDate || !endDate) {
      // 만약 로그가 하루만 있을 경우 처리
      if (sortedLogs.length === 1 && sortedLogs[0].mood) {
        const onlyDate = sortedLogs[0].date;
        return {
          mood: sortedLogs[0].mood,
          days: 1,
          startDate: onlyDate,
          endDate: onlyDate,
          dayDiff: 1
        };
      }
      return null;
    }
  
    const dayDiff = Math.floor((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
  
    return { mood: streakMood, days: maxStreak, startDate, endDate, dayDiff };
  }, [chatLog, year, month]);  

  function formatDate(isoStr) {
    const d = new Date(isoStr);
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  }

  const emotionTendency = useMemo(() => {
    const pos = (monthlyEmotionCounts.Smile || 0) + (monthlyEmotionCounts.Laugh || 0);
    const neg = (monthlyEmotionCounts.Angry || 0) + (monthlyEmotionCounts.Annoyed || 0) + (monthlyEmotionCounts.Frown || 0);
    const meh = monthlyEmotionCounts.Meh || 0;
  
    const total = pos + neg + meh;
    if (total === 0) return null; // 데이터 없음
  
    const posRatio = pos / total;
    const negRatio = neg / total;
    const mehRatio = meh / total;
  
    let result = "";
    if (posRatio >= negRatio && posRatio >= mehRatio) {
      result = "😊 이번 한달은 전체적으로 긍정적인 달이었던 것 같아요!";
    } else if (negRatio >= posRatio && negRatio >= mehRatio) {
      result = "😞 이번 한달은 전체적으로 부정적인 달이었던 것 같아요...";
    } else {
      result = "😐 이번 한달은 별 일 없는 평범한 달이었던 것 같아요.";
    }
  
    return { result, posRatio, negRatio, mehRatio };
  }, [monthlyEmotionCounts]);

  const streakMessages = useMemo(() => {
    if (!emotionStreak) return [];
  
    const { startDate, endDate } = emotionStreak;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const messages = [];
  
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split("T")[0];
      if (chatMessagesByDate[key]) {
        messages.push(...chatMessagesByDate[key]);
      }
    }
  
    return messages;
  }, [emotionStreak, chatMessagesByDate]);

  useEffect(() => {
    const fetchChatLog = async () => {
      const snapshot = await getDocs(collection(db, "chatLog"));
      const logs = snapshot.docs.map(doc => doc.data());
      setChatLog(logs);

      const uniqueLogsMap = new Map();
      logs.forEach(log => {
        uniqueLogsMap.set(log.date, log);
      });
      const uniqueLogs = Array.from(uniqueLogsMap.values());
      setChatLog(uniqueLogs);
  
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
  
      uniqueLogs.forEach(log => {
        if (log.date?.startsWith(currentMonth) && counts.hasOwnProperty(log.mood)) {
          counts[log.mood]++;
        }
      });
  
      setMonthlyEmotionCounts(counts);
    };
  
    fetchChatLog();
  }, [year, month]);

  useEffect(() => {
    const fetchMessagesByDate = async () => {
      const snapshot = await getDocs(collection(db, "chatMessagesByDate"));
      const messages = {};
      snapshot.forEach(doc => {
        messages[doc.id] = doc.data().messages;
      });
      setChatMessagesByDate(messages);
    };
  
    fetchMessagesByDate();
  }, []);

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

  const [streakComment, setStreakComment] = useState("");

  useEffect(() => {
    if (!emotionStreak) return;

    const content = streakMessages.map(m => m.text).join("\n");

    const fetchComment = async () => {
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: `
                다음 채팅 기록은 사용자의 감정이 계속 유지되던 며칠간의 대화야.
                너가 명심해야 할 건 이건 특정 날짜에 대한 코멘트가 아니라 한 달 간의 감정 통계를 보고 내리는 코멘트라는 거야.
                그러니까 오늘같은 단어는 쓰지 말고, 이번 달 같은 단어 위주로 쓰도록 해.
                어떤 사건이나 말이 사용자의 감정에 영향을 줬는지 자연스럽게 추론해서 친구처럼 코멘트를 달아줘.
                계속 이어진 사용자의 감정이 긍정적 감정이라면 신난 친구에게 동조하듯이 써야 해.
                반대로 계속 이어진 사용자의 감정이 부정적 감정이라면 사용자를 위로해줘야 해.
                문장은 1~2줄로 간단하게 써줘. 반말, 현실적인 반응, 유행어 써도 좋아.
                사용자의 감정에 가장 영향을 미쳤다고 판단되는 사건같은 걸 꼭 언급하도록 해.
                예를 들어 사용자가 운좋게 이벤트에 당첨되었다면 이벤트 당첨이라니 진짜 행운이다ㅋㅋㅋ 같은 느낌으로 써줘.`
              },
              { role: "user", content }
            ]
          })
        });

        const data = await res.json();
        const comment = data.choices?.[0]?.message?.content?.trim() || "";
        setStreakComment(comment);

        const keywordRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: `다음 대화에서 자주 등장하는 키워드 2개 혹은 3개를 뽑아줘.
                  꼭 명사 형태로만, 쉼표로 구분해서 알려줘. 예: 산책, 알바, 카페`
              },
              { role: "user", content }
            ]
          })
        });

        const keywordData = await keywordRes.json();
        const keywordRaw = keywordData.choices?.[0]?.message?.content?.trim() || "";
        setStreakKeywords(keywordRaw);

      } catch (err) {
        console.error("코멘트 또는 키워드 생성 실패", err);
      }
    };

    fetchComment();
  }, [emotionStreak, streakMessages]);

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
            <h3><i>" Monthly Report "</i></h3>
            {emotionTendency && (
              <p>
                {emotionTendency.result}
                <br/>
                (긍정적인 감정 비율: {(emotionTendency.posRatio * 100).toFixed(1)}%, 
                부정적인 감정 비율: {(emotionTendency.negRatio * 100).toFixed(1)}%, 
                기타: {(emotionTendency.mehRatio * 100).toFixed(1)}%)
              </p>
            )}

            {emotionStreak && (
              <div style={{ lineHeight: "1.6", fontWeight: "500" }}>
                <p>
                  {formatDate(emotionStreak.startDate)}부터 {formatDate(emotionStreak.endDate)}까지
                  <span style={{marginLeft: "7px"}}>{emotionStreak.dayDiff}일 동안 {emotionStreak.mood} 상태가 길게 나타났어요</span>
                  {streakKeywords && (<p style={{ marginTop: "0.4rem", fontSize: "1.1rem", color: "#444" }}>
                    🔍 이 기간동안 자주 언급된 키워드: <b>{streakKeywords}</b></p>)}
                </p>
                {streakComment && <p>📌 {streakComment}</p>}
              </div>
            )}
          </div>
        </div>
      </div> 
    </div>
  );
}
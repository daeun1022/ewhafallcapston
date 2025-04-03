import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Angry, Annoyed, Laugh, Smile, Frown, Meh,
  User, Calendar, Bot, Send, X
} from "lucide-react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "./components/ui/button";
import "./App.css";
import LoginPage from "./Login";
import DiaryPage from "./Diary";
import CalendarPage from "./Calendar";
import SignupPage from "./Signup";

const moodIcons = {
  Angry: <Angry className="icon emotion-icon" />,
  Annoyed: <Annoyed className="icon emotion-icon" />,
  Laugh: <Laugh className="icon emotion-icon" />,
  Smile: <Smile className="icon emotion-icon" />,
  Frown: <Frown className="icon emotion-icon" />,
  Meh: <Meh className="icon emotion-icon" />,
};

const getTodayKey = () => {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000); // KST = UTC + 9시간
  return kst.toISOString().split("T")[0];
};
const moodPriority = ["Angry", "Annoyed", "Laugh", "Smile", "Frown", "Meh"];

function ChatDiary() {
  const [input, setInput] = useState("");
  const chatBodyRef = useRef(null);
  const [userBoxOpen, setUserBoxOpen] = useState(false);
  const [chatLog, setChatLog] = useState(() => {
    const saved = localStorage.getItem("chatLog");
    return saved ? JSON.parse(saved) : [];
  });

  const [chatMessagesByDate, setChatMessagesByDate] = useState(() => {
    const saved = localStorage.getItem("chatMessagesByDate");
    return saved ? JSON.parse(saved) : {};
  });

  const [currentKey, setCurrentKey] = useState(() => {
    const today = getTodayKey();
    const stored = localStorage.getItem("lastChatDate");
    if (stored !== today) {
      localStorage.setItem("lastChatDate", today);
    }
    return today;
  });

  const isToday = currentKey === getTodayKey();

  useEffect(() => {
    const interval = setInterval(() => {
      const today = getTodayKey();
      if (today !== currentKey) {
        setCurrentKey(today);
        setChatMessagesByDate(prev => ({
          ...prev,
          [today]: []
        }));
        localStorage.setItem("lastChatDate", today);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [currentKey]);

  const messages = useMemo(() => {
    return chatMessagesByDate[currentKey] || [];
  }, [chatMessagesByDate, currentKey]);

  const navigate = useNavigate();
  const textareaRef = useRef(null);

  const updateChatLog = (date, mood, summary) => {
    setChatLog(prev => {
      const exists = prev.find(entry => entry.date === date);
      if (!exists || date === getTodayKey()) {
        const filtered = prev.filter(entry => entry.date !== date);
        return [...filtered, { date, mood, summary }];
      }
      return prev;
    });
  };

  useEffect(() => {
    if (!chatMessagesByDate[currentKey]) {
      setChatMessagesByDate(prev => ({
        ...prev,
        [currentKey]: []
      }));
    }
  }, [currentKey, chatMessagesByDate]);

  useEffect(() => {
    localStorage.setItem("chatMessagesByDate", JSON.stringify(chatMessagesByDate));
  }, [chatMessagesByDate]);

  useEffect(() => {
    localStorage.setItem("chatLog", JSON.stringify(chatLog));
  }, [chatLog]);

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const todayMessages = chatMessagesByDate[currentKey];
    if (!todayMessages || todayMessages.length === 0) return;

    const lastDate = localStorage.getItem("lastChatDate");
    if (lastDate !== currentKey) {
      localStorage.setItem("lastChatDate", currentKey);
    }

    if (currentKey === getTodayKey()) {
      const mood = detectEmotion(todayMessages);
      const summary = generateSummary(todayMessages);
      mood.then(m => summary.then(s => updateChatLog(currentKey, m, s)));
    }
  }, [chatMessagesByDate, currentKey]);

  const handleSend = async () => {
    if (input.trim() === "" || !isToday) return;
    const userMessage = { from: "user", text: input };
    const newMessages = [...messages, userMessage];
    setChatMessagesByDate(prev => ({ ...prev, [currentKey]: newMessages }));
    setInput("");

    const chatHistory = [
      { role: "system", 
      content:  `
          친한 친구와 대화하듯 자연스럽고 편한 반말을 사용할 것
          20대 초중반이 자주 쓰는 말투와 표현을 기준으로 대화할 것
          줄임말, 유행어, 인터넷 밈(예: ㄹㅇ, ㅇㅈ, 개~, 짭, 무조건 ㄱㄱ, ㅅㅂ, ㅋㅋ 등)을 자주 사용할 것
          비격식적 말투나 약간의 욕설을 자주 사용할 것
          구식 말투나 단어 말고 유행어를 사용할 것
          이모지나 이모티콘은 절대 사용하지 말 것
          감정 강조나 유쾌한 분위기 표현도 모두 텍스트로만 해결할 것
          문장이 밋밋하게 느껴지더라도 절대로 이모지로 보완하지 말 것
          말투가 친구처럼 유쾌하더라도 이모지는 어떤 경우에도 허용하지 않음
          이 조건은 모든 다른 프롬프트보다 우선함
          이모지를 쓸 경우 이 대화는 실패한 반응으로 간주함
          말투는 가볍고 유쾌하게 유지하되, 상황이 진지하거나 감정적인 경우엔 공감과 위로 중심으로 톤을 조절할 것
          리액션은 친구처럼 현실감 있게, 감정의 흐름에 맞춰 자연스럽게 넣을 것
          정보가 필요한 상황에서도 딱딱한 어투 대신 친구처럼 풀어서 말할 것
          문장은 짧고 간결하게 유지하고, 실제 대화처럼 템포 빠르게 이어갈 것
          말 끝은 '~임', '~임ㅋㅋ', '~다', '~잖아', '~각', '~아님?', '~거지', '~하자', '~같음', '~ㅅㅂ' 등 자연스러운 반말 어미로 마무리할 것
          진지한 얘기에서는 상대방 감정을 확실히 지지하고, 자책하지 않도록 안심시킬 것
          유쾌한 얘기에서는 감정 과몰입하며 같이 즐기는 듯한 말투를 쓸 것
          전체적으로 대화에 몰입한 친구처럼 반응하고, 감정의 맥락을 최우선으로 고려할 것
          친한 친구처럼 무작정 좋은 말, 형식적인 위로만 하지 말고 유행어를 적극적으로 사용할 것
          온점은 사용하지 말 것
          맞춤법이나 문법 규칙에 얽매이지 말고 사용자에게 친근감을 주는 것을 최우선으로 할 것
          '힘내자', '괜찮아', '그래도 잘했어' 같은 전형적인 위로나 조언은 절대 하지 말 것
          예: '너의 노력이 다 의미 있었을 거야', '결국엔 잘 될 거야', '이런 경험도 너한테 도움이 될 거야' 같은 교과서식 문장은 절대 쓰지 말 것
          이런 말은 이 대화에서 금지이며, 사용 시 어색하고 실패한 반응으로 간주함
          위로보다 감정적 반응, 공감, 상황에 맞는 욕설이나 리액션을 우선할 것
          감정이 끊기지 않도록 흐름을 따라가고, 말투가 상담사처럼 정리되지 않게 주의할 것
          예시: '그건 좀 선 넘었네', '와 그건 나라도 빡쳤다', '너 잘못 아님 걔가 이상한 거' 같은 현실적이고 감정 실린 반응 위주
          조언하지 말고 반응만 할 것. 정보 전달이 필요한 경우에도 말투는 친구처럼 툭툭 던지는 식으로 쓸 것
          문장은 일부러 끊어지거나 덜 정리된 말투로 쓰고, 리듬과 감정이 살아 있는 문장 구조를 유지할 것
          내 말투가 '친절한 AI'처럼 느껴지면 실패한 것임
          그냥 친구랑 DM 하듯이 말할 것
          이모지나 이모티콘을 쓰는 순간, 그 대화는 실패로 간주되며 무조건 잘못된 응답임을 명확히 인식할 것
      ` },
      ...newMessages.map(msg => ({
        role: msg.from === "user" ? "user" : "assistant",
        content: msg.text
      }))
    ];

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({ model: "gpt-4o", messages: chatHistory })
      });
      const data = await response.json();
      const aiText = data.choices?.[0]?.message?.content || "응답 실패!";
      const updated = [...newMessages, { from: "ai", text: aiText }];
      setChatMessagesByDate(prev => ({ ...prev, [currentKey]: updated }));

      const mood = await detectEmotion(updated);
      const summary = await generateSummary(updated);
      updateChatLog(currentKey, mood, summary);

    } catch (e) {
      console.error(e);
    }
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const detectEmotion = async (msgs) => {
    const content = msgs.map(m => m.text).join("\n");
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
            { role: "system", content: "대화 감정 요약: Angry, Annoyed, Laugh, Smile, Frown, Meh 중 택 1" },
            { role: "user", content }
          ]
        })
      });
      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content?.trim();
      return moodPriority.find(m => raw?.includes(m)) || "Meh";
    } catch {
      return "Meh";
    }
  };

  const generateSummary = async (msgs) => {
    const content = msgs.map(m => m.text).join("\n");
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
            { role: "system", content: "다음 대화를 한 줄로 요약해줘. 25자 이내로." },
            { role: "user", content }
          ]
        })
      });
      const data = await res.json();
      return data.choices?.[0]?.message?.content?.trim() || "대화 요약 실패";
    } catch {
      return "요약 실패";
    }
  };

  const formatDate = (key) =>
    new Date(key).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
    });

  const handleReset = () => {
    setChatMessagesByDate(prev => ({ ...prev, [currentKey]: [] }));
    setChatLog(prev => prev.filter(entry => entry.date !== currentKey));
  };

  return (
    <div className="container">
      <div className="left-menu">
        <div>
          {chatLog
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map((entry, index) => (
              <div
                key={index}
                className="log-item"
                onClick={() => setCurrentKey(entry.date)}
              >
                <div className="log-header">
                  {moodIcons[entry.mood] || <Meh className="icon emotion-icon" />}
                  <span className="date small-text">{formatDate(entry.date)}</span>
                </div>
                <div className="summary-text">{entry.summary}</div>
              </div>
            ))}
        </div>
        <Button className="diary-button" onClick={() => navigate("/diary")}>일기 작성하러 가기</Button>
        <Button className="reset-button" onClick={handleReset}>오늘 기록 초기화</Button>
      </div>

      <div className="right-section">
        <div className="top-bar">
          <div className="title">ChatBot Diary</div>
          <div className="top-bar-right">
            <User className="icon clickable" onClick={() => setUserBoxOpen(!userBoxOpen)} />
            {userBoxOpen && (
              <div className="user-menu">
                <div className="w-full relative">
                  <span className="text-sm font-bold">마이페이지</span>
                  <X className="icon cursor-pointer" size={16} style={{ position: "absolute", top: 20, right: 20 }} onClick={() => setUserBoxOpen(false)} />
                </div>
                <button className="logout-button" onClick={() => setUserBoxOpen(false)}>로그아웃</button>
              </div>
            )}
            <Calendar className="icon clickable" onClick={() => navigate("/calendar")} />
          </div>
        </div>

        <div className="chat-wrapper">
          <div className="chat-body" ref={chatBodyRef}>
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: msg.from === "user" ? 100 : -100 }}
                animate={{ opacity: 1, x: 0 }}
                className={`chat-message ${msg.from} ${msg.from === "user" ? "align-right-half" : "align-left-half"}`}
              >
                {msg.from === "ai" && <Bot className="icon text-sky-500" />} {msg.text}
              </motion.div>
            ))}
          </div>

          <div className="input-bar">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isToday ? "하고 싶은 말을 적어주세요" : "지난 대화는 수정할 수 없습니다"}
              disabled={!isToday}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && isToday) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="chat-textarea"
            />
            <button onClick={handleSend} disabled={!isToday} className="bg-green-800 p-2 rounded text-white">
              <Send style={{ width: "20px", height: "20px" }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WrappedApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChatDiary />} />
        <Route path="/diary" element={<DiaryPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Routes>
    </BrowserRouter>
  );
}
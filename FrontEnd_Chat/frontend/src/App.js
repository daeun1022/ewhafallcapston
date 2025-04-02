import React, { useState, useRef, useEffect } from "react";
import { Button } from "./components/ui/button";
import { Smile, Frown, Meh, User, Calendar, Bot, Send, X } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate, BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import DiaryPage from "./Diary";
import CalendarPage from "./Calendar";
import LoginPage from "./Login";

const moodIcons = {
  happy: <Smile className="icon" />,
  neutral: <Meh className="icon" />,
  sad: <Frown className="icon" />,
  slightlySad: <Frown className="icon text-orange-500" />,
};

const chatLog = [
  { date: "2025/3/13 (수)", mood: "sad", user: true },
  { date: "2025/3/14 (목)", mood: "slightlySad", user: true },
  { date: "2025/3/15 (금)", mood: "happy", ai: true },
  { date: "2025/3/16 (일)", mood: "neutral", user: true },
  { date: "2025/3/17 (월)", mood: "happy", ai: true },
  { date: "2025/3/18 (화)", mood: "neutral", user: true },
  { date: "2025/3/19 (수)", mood: "happy", ai: true },
  { date: "2025/3/20 (목)", mood: "slightlySad" },
];

function ChatDiary() {
  const [input, setInput] = useState("");
  const [userBoxOpen, setUserBoxOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("chatMessages");
    return saved ? JSON.parse(saved) : [
      { from: "user", text: "사용자 입력" },
      { from: "ai", text: "챗봇 입력" }
    ];
  });

  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  const navigate = useNavigate();
  const textareaRef = useRef(null);

  const handleSend = async () => {
    if (input.trim() === "") return;
  
    const userMessage = { from: "user", text: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
  
    // OpenAI 포맷으로 변환
    const chatHistory = [
      {
        role: "system",
        content: `친한 친구와 대화하듯 자연스럽고 편한 반말을 사용할 것
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
          이모지나 이모티콘을 쓰는 순간, 그 대화는 실패로 간주되며 무조건 잘못된 응답임을 명확히 인식할 것`,
      },
      ...updatedMessages.map((msg) => ({
        role: msg.from === "user" ? "user" : "assistant",
        content: msg.text,
      })),
    ];
  
    try {
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
  
      const data = await response.json();
      const aiText = data.choices?.[0]?.message?.content || "답변을 가져오지 못했습니다.";
      const aiMessage = { from: "ai", text: aiText };
      setMessages((prev) => [...prev, aiMessage]);
  
    } catch (error) {
      console.error("OpenAI 응답 실패:", error);
      setMessages((prev) => [...prev, { from: "ai", text: "에러가 발생했어요. 다시 시도해줘!" }]);
    }
  
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  return (
    <div className="container">
      {/* Left Menu */}
      <div className="left-menu">
        <div>
          {chatLog.map((entry, index) => (
            <div key={index} className="log-item">
              {moodIcons[entry.mood]}
              <span className="date">{entry.date}</span>
            </div>
          ))}
        </div>
        <Button className="diary-button" onClick={() => navigate("/diary")}>일기 작성하러 가기</Button>
      </div>

      {/* Right Section */}
      <div className="right-section">
        {/* Top Bar */}
        <div className="top-bar">
          <div className="top-bar-left">
            <div className="title">ChatBot Diary</div>
          </div>
          <div className="top-bar-right">
            <User
              className="icon clickable"
              onClick={() => setUserBoxOpen(!userBoxOpen)}
            />
            {userBoxOpen && (
              <div className="user-menu">
                <div className="w-full relative">
                  <span className="text-sm font-bold">마이페이지</span>
                  <X
                    className="icon cursor-pointer"
                    size={16}
                    style={{ position: "absolute", top: 20, right: 20}}
                    onClick={() => setUserBoxOpen(false)}
                  />
                </div>
                <button className="logout-button" onClick={() => setUserBoxOpen(false)}>로그아웃</button>
              </div>
            )}
            <Calendar className="icon clickable" onClick={() => navigate("/calendar")} />
          </div>
        </div>

        {/* Chat Section */}
        <div className="chat-wrapper">
          <div className="chat-body">
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: msg.from === "user" ? 100 : -100 }}
                animate={{ opacity: 1, x: 0 }}
                className={`chat-message ${msg.from} ${
                  msg.from === "user" ? "align-right-half" : "align-left-half"
                }`}
              >
                {msg.from === "ai" && <Bot className="icon text-sky-500" />} {msg.text}
              </motion.div>
            ))}
          </div>

          {/* Input Field */}
          <div className="input-bar">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="하고 싶은 말을 적어주세요"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="chat-textarea"
            />
            <button
              onClick={handleSend}
              className="bg-green-800 p-2 rounded text-white"
            >
              <Send style={{ width: "20px", height: "20px" }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 🧭 라우터로 전체 감싸기
export default function WrappedApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChatDiary />} />
        <Route path="/diary" element={<DiaryPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}

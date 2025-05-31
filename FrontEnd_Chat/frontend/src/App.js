import React, { useState, useRef, useEffect, useMemo } from "react";
import { Angry, Annoyed, Laugh, Smile, Frown, Meh, User, Calendar, Bot, Send, X } from "lucide-react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "./components/ui/button";
import "./App.css";
import LoginPage from "./Login";
import DiaryPage from "./Diary";
import CalendarPage from "./Calendar";
import SignupPage from "./Signup";
//login
import { signOut } from "firebase/auth";
import { auth } from "./firebase";
//db
import { db } from "./firebase";
import { doc, getDocs, setDoc, collection, onSnapshot, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { onAuthStateChanged } from "firebase/auth";

/* lucid-react에서 감정 이모티콘 갖고 옴 */
const moodIcons = {
  Angry: <Angry className="icon emotion-icon" />,
  Annoyed: <Annoyed className="icon emotion-icon" />,
  Laugh: <Laugh className="icon emotion-icon" />,
  Smile: <Smile className="icon emotion-icon" />,
  Frown: <Frown className="icon emotion-icon" />,
  Meh: <Meh className="icon emotion-icon" />,
};

/* 감정들의 우선순위 설정 - 모호한 경우 앞에 있는 걸 우선적으로 선택 */
const moodPriority = ["Angry", "Annoyed", "Laugh", "Smile", "Frown", "Meh"];

/* kst를 기준으로 현재의 시간을 계산한 뒤 2025-04-07 형식의 String으로 변환 */
const getTodayKey = () => {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000); // KST = UTC + 9시간
  return kst.toISOString().split("T")[0];
};

//로그아웃 함수 정의
const LogOut = () => {
  signOut(auth)
    .then(() => {
      console.log('로그아웃 성공');
    })
    .catch((error) => {
      console.error('로그아웃 실패', error);
    });
};

export function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (!currentUser) {
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  if (loading) {
    return <div>로딩 중...</div>;
  }

  return user ? children : null;
}

function ChatDiary() {

  // 로그인 여부 확인 및 보호 라우팅
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // 로그인하지 않은 사용자 → 강제 이동
        navigate("/Login");
      }
    });
    return () => unsubscribe(); // 컴포넌트 언마운트 시 정리
  }, []);

   // 오늘 날짜의 키를 반환하는 함수
  function getTodayKey() {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  const [chatMessagesByDate, setchatMessagesByDate] = useState({});
  /*dateKey 가 없다면 getTodayKey로 오늘날짜 호출 & 있다면 2025-04-07 형식으로 바꿔 currentKey로 설정 */

  /* URL 경로에 있는 dateKey 값을 갖고옴 ex.20250407 */
  const { dateKey } = useParams();

  const currentKey = useMemo(() => {
    if (!dateKey) return getTodayKey();
    return `${dateKey.slice(0, 4)}-${dateKey.slice(4, 6)}-${dateKey.slice(6)}`;
  }, [dateKey]);

  // ✅ 특정 날짜(currentKey)의 메시지만 불러오기
  useEffect(() => {
    const fetchMessagesForCurrentDate = async () => {
      try {
        const docRef = doc(chatMessagesRef, currentKey);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setchatMessagesByDate(prev => ({
            ...prev,
            [currentKey]: data.messages || []
          }));
        } else {
          setchatMessagesByDate(prev => ({
            ...prev,
            [currentKey]: []
          }));
        }
      } catch (error) {
        console.error('Error fetching messages for current date:', error);
      }
    };
    fetchMessagesForCurrentDate();
  }, [currentKey]);

  //Firestore 컬렉션 참조
  const chatLogRef = collection(db, 'chatLog');
  const chatMessagesRef = collection(db, 'chatMessagesByDate');

  /* 현재 보고있는 날짜가 오늘인지 아닌지 확인 - 지나간 날짜의 채팅창을 막기 위해서 */
  const isToday = currentKey === getTodayKey();

  // chatLog 상태 초기화 및 Firestore에서 데이터 로드
  const [chatLog, setChatLog] = useState([]);
  useEffect(() => {
    const fetchChatLog = async () => {
      const snapshot = await getDocs(chatLogRef);
      const logs = snapshot.docs.map(doc => doc.data());
      setChatLog(logs);
    };
    fetchChatLog();
  }, []);

  // chatLog 상태가 변경될 때 Firestore에 업데이트
  useEffect(() => {
    const updateChatLog = async () => {
      chatLog.forEach(async (log) => {
        const docRef = doc(chatLogRef, log.date);
        await setDoc(docRef, log);
      });
    };
    if (chatLog.length > 0) {
      updateChatLog();
    }
  }, [chatLog]);

  // chatMessagesByDate 상태가 변경될 때 Firestore에 업데이트
  useEffect(() => {
    const updateChatMessages = async () => {
      for (const [date, messages] of Object.entries(chatMessagesByDate)) {
      const docRef = doc(chatMessagesRef, date);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // 새 메시지만 추출해서 arrayUnion으로 추가
        const existingMessages = docSnap.data().messages || [];

        const newMessages = messages.slice(existingMessages.length); // 추가된 부분만 추출

        for (const message of newMessages) {
          await updateDoc(docRef, {
            messages: arrayUnion(message),
          });
        }
      } else {
        await setDoc(docRef, { messages }); // 새 문서 생성
      }
    }
  };
  if (Object.keys(chatMessagesByDate).length > 0) {
    updateChatMessages();
  }  
        
  }, [chatMessagesByDate]);

  // messages 상태 설정
  const messages = useMemo(() => chatMessagesByDate[currentKey] || [], [chatMessagesByDate, currentKey]);

  // 오늘 날짜가 없으면 빈 배열 추가 (chatMessagesByDate가 비어있지 않을 때만)
  useEffect(() => {
    const today = getTodayKey();
    if (!chatMessagesByDate[today] && Object.keys(chatMessagesByDate).length > 0) {
      setchatMessagesByDate(prev => ({ ...prev, [today]: [] }));
    }
  }, [chatMessagesByDate]);

  // currentKey에 해당하는 날짜가 없으면 빈 배열 추가 (단, chatMessagesByDate가 비어있지 않을 때만)
  useEffect(() => {
    if (!chatMessagesByDate[currentKey] && Object.keys(chatMessagesByDate).length > 0) {
      setchatMessagesByDate(prev => ({ ...prev, [currentKey]: [] }));
    }
  }, [currentKey, chatMessagesByDate]);

  /* 페이지 이동을 위한 함수 ex. /Diary -> 달력 페이지로 이동 */
  const navigate = useNavigate();

  /* 10초마다 날짜를 체크해 날짜가 바뀌었다면 새로고침하지 않더라도 navigate를 통해 자동으로 새 채팅창으로 이동 */
  useEffect(() => {
    const interval = setInterval(() => {
      const newKey = getTodayKey();
      if (isToday === false && newKey !== currentKey) {
        navigate(`/${newKey.replace(/-/g, "")}`);
      }
    }, 10 * 1000); // 10초마다 체크
    return () => clearInterval(interval);
  }, [currentKey, isToday, navigate]);

  /* currentKey를 기반으로 todayMessages를 갖고 오고 해당 currentKey 가 getTodayKey와 같을 경우(오늘 날짜일 경우) 감정분석하고 요약해서 chatLog에 반영 - 과거 날짜의 감정 및 대화 내용 요약은 해당 일자가 지나면 더이상 바뀌지 않도록 */
  useEffect(() => {
    const todayMessages = chatMessagesByDate[currentKey];
    if (!todayMessages || todayMessages.length === 0) return;
    if (currentKey === getTodayKey()) {
      const mood = detectEmotion(todayMessages);
      const summary = generateSummary(todayMessages);
      mood.then(m => summary.then(s => updateChatLog(currentKey, m, s)));
    }
  }, [chatMessagesByDate, currentKey]);

  /*텍스트 입력창 내용 관리 */
  const [input, setInput] = useState("");

  /* DOM 요소 접근 - 채팅 화면 자동 스크롤 이나 텍스트 입력창이 길어질 때 스크롤 기능 등을 위해 */
  const textareaRef = useRef(null);

  /* 화면 자동 스크롤 */
  const chatBodyRef = useRef(null);

  /* 새로운 메세지가 생길 때마다 채팅창을 가장 밑으로 내림 */
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  /*User 메뉴 토글 상태 */
  const [userBoxOpen, setUserBoxOpen] = useState(false);

  /* 사용자나 AI의 응답에 따라 왼쪽 메뉴의 ChatLog 업데이트 */
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

  /* 사용자가 메세지 입력시 채팅창에 해당 메세지를 추가하고 입력창을 비워줌 - 만약 isToday가 아니라면(오늘 날짜가 아니라면) 채팅창 입력을 막음 */
  const handleSend = async () => {
    if (input.trim() === "" || !isToday) return;
    const userMessage = { from: "user", text: input };
    const newMessages = [...messages, userMessage];
    setchatMessagesByDate(prev => ({ ...prev, [currentKey]: newMessages }));
    setInput("");

    // Firestore에도 직접 저장
    const docRef = doc(chatMessagesRef, currentKey);
    await setDoc(docRef, { messages: newMessages });

    /* 채팅 AI 프롬프트 */
    const chatHistory = [
      {
        role: "system",
        content: `
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
      // 오픈 API가 이해할 수 있는 형식으로 메세지 포맷을 바꿈 ex.ai -> assistant & text -> content
      ...newMessages.map(msg => ({
        role: msg.from === "user" ? "user" : "assistant",
        content: msg.text
      }))
    ];

    try {
      //Open API에 POST 요청을 보냄
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({ model: "gpt-4o", messages: chatHistory })
      });
      //응답을 JSON 형식으로 변환
      const data = await response.json();
      //AI의 응답 텍스트를 꺼내옴
      const aiText = data.choices?.[0]?.message?.content || "응답 실패!";
      //기존 메세지 배열 뒤에 AI의 응답을 붙여 새로운 메세지 배열 생성
      const updated = [...newMessages, { from: "ai", text: aiText }];

      //currentKey 날짜에 해당하는 대화에 받아온 AI 응답 추가
      setchatMessagesByDate(prev => ({ ...prev, [currentKey]: updated }));

      // 전체 대화 내용을 기반으로 감정 분석 및 대화내용 요약 진행
      const mood = await detectEmotion(updated);
      const summary = await generateSummary(updated);
      // 감정 분석 및 대화내용 요약 후 왼쪽 메뉴의 ChatLog 에 저장
      updateChatLog(currentKey, mood, summary);

      //오류 발생시 콘솔창에 오류 출력
    } catch (e) {
      console.error(e);
    }
    // 입력창 높이 자동 조정
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const detectEmotion = async (msgs) => {
    // 메세지 객체에서 text만 추출한 뒤 \n 으로 연결
    const content = msgs.map(m => m.text).join("\n");
    // POST 방식으로 OPEN API 호출
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
            // 감정 분석 프롬프트
            { role: "system", content: "대화 감정 요약: Angry, Annoyed, Laugh, Smile, Frown, Meh 중 택 1" },
            // 대화 내용 전달
            { role: "user", content }
          ]
        })
      });
      //응답 JSON 에서 감정 분석 결과 데이터를 꺼내옴
      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content?.trim();
      //raw 문자열에 주어진 감정 중 어떤 감정이 있는 지 찾고 해당 감정을 반환 / 찾지 못했다면 기본 감정인 Meh 반환
      return moodPriority.find(m => raw?.includes(m)) || "Meh";
    } catch {
      return "Meh";
    }
  };

  const generateSummary = async (msgs) => {
    // 메세지 객체에서 text만 추출한 뒤 \n 으로 연결
    const content = msgs.map(m => m.text).join("\n");
    // POST 방식으로 OPEN API 호출
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
            // 대화 요약 프롬프트
            {
              role: "system",
              content: `다음 대화를 **20자 이내**의 한 줄로 요약해줘.
              요약은 명사형으로 끝나야 하고, 대화문 형식이 아닌 평서문 형태로 적어줘.
              요약의 내용은 사용자가 가장 강한 감정을 느낀 사건과 관련이 있어야 해.
              예를 들어 사용자가 시험을 망쳐서 기분이 안좋았고, 그 다음 카페에 갔다고 하면 시험을 망쳐서 화난 기분과 카페에 가서 좋은 기분 중 더 강하게 느껴진 감정의 사건을 요약해서 적어줘.
              끝에 [.] 쓰지 마.` },
            // 대화 내용 전달
            { role: "user", content }
          ]
        })
      });
      //응답 JSON 에서 대화 요약 결과 데이터를 꺼내옴
      const data = await res.json();
      return data.choices?.[0]?.message?.content?.trim() || "대화 요약 실패";
    } catch {
      return "요약 실패";
    }
  };

  /* key 문자열을 받아 날짜 객체로 바꿈 - 왼쪽 메뉴의 ChatLog에 2025.04.07 (월) 형식으로 표현하기 위해 */
  const formatDate = (key) => new Date(key).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });

  /* 오늘 기록 초기화 선택시 오늘 날짜의 모든 대화기록을 초기화 시키는 용도 */
  const handleReset = () => {
    setchatMessagesByDate(prev => ({ ...prev, [currentKey]: [] }));
    setChatLog(prev => prev.filter(entry => entry.date !== currentKey));
  };

  //로그아웃 함수 정의
  const LogOut = () => {
    signOut(auth)
      .then(() => {
        console.log('로그아웃 성공');
      })
      .catch((error) => {
        console.error('로그아웃 실패', error);
      });
  };

  const handleLogout = () => {
    if (auth.currentUser) {
      signOut(auth)
        .then(() => {
          console.log("로그아웃 완료");
          navigate("/signup");
        })
        .catch((error) => {
          console.error("로그아웃 오류:", error);
        });
    } else {
      // 로그인 안 된 상태일 때
      navigate("/signup");
    }
  };

  /* 전체적인 인터페이스 */
  return (
    <div className="container">
      {/* 왼쪽 사이드 바 기능*/}
      <div className="left-menu">
        <div>
          {/* 왼쪽 사이드 바 기능*/}
          {chatLog
            /* 날짜별 채팅 요약 리스트 내림차순 정리*/
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            /* 왼쪽 사이드 바에 있는 날짜별 채팅 요약 리스트 - map을 통해 각각 하나의 div로*/
            .map((entry, index) => (
              <div
                key={index}
                className="log-item"
                onClick={() => navigate(`/${entry.date.replace(/-/g, "")}`)}
              >
                {/* 요약 리스트에 각각 감정 이모티콘과 대화 내용 요약을 표시 */}
                <div className="log-header">
                  {moodIcons[entry.mood] || <Meh className="icon emotion-icon" />}
                  <span className="date small-text">{formatDate(entry.date)}</span>
                </div>
                <div className="summary-text">{entry.summary}</div>
              </div>
            ))}
        </div>
        <Button className="diary-button" onClick={() => navigate(`/diary?date=${currentKey}`)}>일기화면으로 이동하기</Button>
        {/*<Button className="reset-button" onClick={handleReset}>오늘 기록 초기화</Button>*/}
      </div>

      <div className="right-section">
        {/* 상단바 기능 */}
        <div className="top-bar">
          <div className="title" style={{ cursor: "pointer" }} onClick={() => navigate(`/today`)}>ChatBot Diary</div>
          <div className="top-bar-right">
            {/* 유저 아이콘 기능 */}
            <User className="icon clickable" onClick={() => setUserBoxOpen(!userBoxOpen)} />
            {userBoxOpen && (
              <button className="logout-button" onClick={() => {
                LogOut(); //추가. + { }setUserBoxOpen(false);navigate("/login");
              }}>로그아웃</button>
            )}
            {/* 달력 */}
            <Calendar className="icon clickable" onClick={() => navigate("/calendar")} />
          </div>
        </div>

        {/* 채팅 화면 기능 */}
        <div className="chat-wrapper">
          <div className="chat-body" ref={chatBodyRef}>
            {/* 사용자와 AI의 채팅을 각각 motion.dv로 만듦 */}
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                /* user의 입력일 경우 오른쪽에서, AI의 입력일 경우 왼쪽에서 나타남 */
                initial={{ opacity: 0, x: msg.from === "user" ? 100 : -100 }}
                /* 말풍선 애니메이션 기능 */
                animate={{ opacity: 1, x: 0 }}
                /* user의 입력일 경우 오른쪽 절반에, AI의 입력일 경우 왼쪽 절반에 표시 */
                className={`chat-message ${msg.from} ${msg.from === "user" ? "align-right-half" : "align-left-half"}`}
              >
                {msg.from === "ai" && <Bot className="icon text-sky-500" />} {msg.text}
              </motion.div>
            ))}
          </div>

          {/* 텍스트 입력 창 */}
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


/* 사이트 URL을 /20250407 이런식으로 오늘 날짜를 바꿔주는 용도 - 사이트 들어갔을 때 항상 오늘의 채팅 화면이 뜰 수 있게 하기 위해서 */
function NavigateToToday() {
  const navigate = useNavigate();
  useEffect(() => {
    const today = getTodayKey().replace(/-/g, "");
    navigate(`/${today}`);
  }, [navigate]);
  return null;
}

/* 다른 페이지로 이동 */
export default function WrappedApp() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />             {/* 시작화면 */}
      <Route path="/today" element={<NavigateToToday />} />
      <Route path=":dateKey" element={<ChatDiary />} />
      <Route path="/diary" element={<DiaryPage />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
    </Routes>
  );
}
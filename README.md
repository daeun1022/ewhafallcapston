# **ChatBot Diary**
## 감정 정리가 필요한 사람들을 위한 채팅형 AI 모델 기반 일기 대리 작성 서비스
✔️ 스트레스는 받지만 그걸 해소할 시간이 없다면? <br>
✔️ 일기를 쓰고 싶지만 너무 바쁘다면? <br>
✔️ 주변 사람들에게 자신의 개인적인 이야기를 털어놓기 힘들다면? <br>

부정적 감정을 해소하고, 자신도 미처 몰랐던 감정들을 파악하기 위해<br>
AI 챗봇과 대화를 나누며 일기를 작성하는 **ChatBot Diary** 프로젝트를 진행하였습니다.

## 프로젝트 소개
### Target Customer
: 자신의 감정을 주변에 솔직하게 드러내지 못해 외로움을 느끼고, 하루 일과에 쫓겨 일기를 쓰는 것 조차 힘든 시간적 피로를 겪으며, 이미 정신적으로 많이 지쳐 자신의 감정 상태를 돌아볼 여유조차 없을 정도로 정신적 부담을 안고 있는 사람들

### Pain Point
: 스트레스 원인 파악의 어려움, 시간 부족, 사회적 고립, 프라이버시 보장에 관한 걱정

### Solution
💚 **AI 챗봇 활용** <br>
: 사용자에게 **프라이버시 걱정 없고 부정적인 얘기도 잘 들어주는** 대화 상대 제공함 **개별 사용자에게 맞게 학습 가능** <br><br>
💚 **AI 가 작성해주는 일기** <br>
: 챗봇과의 채팅 내용을 기반으로 AI가 대신 일기를 작성해 **짧은 시간 투자로도 일기 완성 가능** <br><br>
💚 **AI 가 추출해주는 감정** <br>
: 챗봇과의 채팅 내용을 기반으로 AI가 대신 사용자의 감정을 추출하고 정리해 **정신적 / 시간적 부담 완화** <br>
  
### Keywords
: 채팅 AI와의 커뮤니케이션, 요약 AI의 자동 일기 작성, 감정 분석 시각화

## 주요 기능
### 🗒️ **챗봇 기능**
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ✨ 공감 능력에 최적화되고 친밀한 대화를 할 수 있도록 설계된 챗봇 AI의 프롬프트 <br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ✨ FireBase를 통한 사용자의 데이터 개별 관리 <br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ✨ 일자별로 채팅 세션을 별도 관리 <br><br>
  
### 🗒️ **일기 작성 기능** 
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ✨ 채팅 내용을 기반으로 한 일기 작성 <br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ✨ AI 작성 일기에 대한 사용자 피드백 기능 <br><br>
  
### 🗒️ **감정 추출 기능** 
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ✨ AI와의 대화 내용을 기반으로 한 사용자의 감정 추출 <br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ✨ 달력 페이지에서 해당 날짜의 사용자의 감정 시각화 <br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ✨ 달력 페이지에서 월간 감정 통계 제공 <br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ✨ AI의 감정 추이 분석 <br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ✨ AI 감정 분석에 대한 사용자 피드백 기능 <br>

## 코드 및 구조 설명
### 프로젝트 구조
```
ewhafallcapston/FrontEnd_Chat/frontend/
├── .env                                     # OpenAI API Key 저장용 환경 변수 파일
├── /src
│   ├── App.js                               # 채팅 화면. AI 챗봇 제공 및 대화 진행
│   ├── App.css                              # 채팅 화면의 스타일 정의
│   ├── Calendar.js                          # 캘린더 화면. 일기 화면에서 AI가 추출한 감정들을 모아보고 통계 분석 가능
│   ├── Calendar.css                         # 캘린더 화면의 스타일 정의
│   ├── Diary.js                             # 일기 화면. 채팅 내용을 기반으로 한 일기 생성 및 감정 분석 진행
│   ├── Diary.css                            # 일기 화면의 스타일 정의
│   ├── Firebase.js                          # Firebase 초기 설정 및 Firestore/Auth 인스턴스 생성
│   ├── Index.js                             # 앱 렌더링 시작점 (Router 설정 포함)
│   ├── Index.css                            # 사이트 전역 스타일 설정
│   ├── LineChart.js                         # 캘린더 화면에 Line Chart 제공. 각 감정 종류를 data ID로 받아 주차별 통계 계산 및 시각화
│   ├── LineChart.css                        # Line Chart Component의 스타일 정의
│   ├── Login.js                             # 인트로 화면. 파이어베이스의 유저 데이터를 기반으로 한 로그인 기능 제공
│   ├── Login.css                            # 인트로 화면의 스타일 정의
│   ├── ReportWebVitals.js                   # 웹 성능 측정 함수 (LCP, FID 등 기록)
│   ├── SetupTests.js                        # jest-dom 매처를 적용하기 위한 테스트 설정 파일
│   ├── Signup.js                            # 회원가입 화면. 이메일을 기반으로 한 유저 등록 기능 제공
│   ├── Signup.css                           # 회원가입 화면의 스타일 정의
│   ├── components/ui                                     
│   │   ├── button.js                        # Button Component의 구조 정의
│   │   ├── card.js                          # Card Component의 구조 정의
│   │   ├── input.js                         # Input Component의 구조 정의
```

### 사용기술
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat&logo=openai&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)

### 코드 설명
🌟 **OPEN AI 연결 코드** 
```
const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({ model: "gpt-4o", messages: chatHistory })
      });
```
GPT-4o 모델과 연결하는 코드. 사용자의 채팅 기록을 POST 요청으로 보내면, 챗봇의 응답과 함께 생성된 일기와 감정 분석 결과를 받아올 수 있음.
<br>

🌟 **채팅 내용 저장 코드** 
```
const docRef = doc(chatMessagesRef, date);
const docSnap = await getDoc(docRef);

if (docSnap.exists()) {
  await updateDoc(docRef, {
    messages: arrayUnion(message),
  });
} else {
  await setDoc(docRef, { messages });
}
```
Firestore의 chatMessagesByDate 에 채팅 메세지를 날짜별 배열 형식으로 저장하는 코드. 이미 배열이 저장된 날짜라면 새 메시지만 골라서 arrayUnion으로 추가하고, 없으면 새 날짜 배열을 만들어 저장함.
<br>

## How to Install
### 1. 저장소 Clone
```
git init
git clone https://github.com/daeun1022/ewhafallcapston.git
```

### 2. VSCode에서 패키지 설치
vs code 실행 후 terminal 창에서 필요한 패키지 설치
```
cd ewhafallcapston/FrontEnd_Chat/frontend
npm install
```

### 3. OpenAI API Key 설정
아래와 같은 형식으로 .env 파일을 생성한 후, [OPEN API KEY] 위치에 발급받은 OpenAI API Key를 입력<br>
※ .env 파일은 src 폴더와 같은 경로(frontend/)에 있어야 정상 작동함
```
REACT_APP_OPENAI_API_KEY=[OPEN API KEY]
```

## How to Build
### VSCode에서 실행
```
npm run
```
<img src=https://github.com/daeun1022/ewhafallcapston/blob/main/Images/%EC%8B%A4%ED%96%89_%EC%84%B1%EA%B3%B5.png> <br> 정상적으로 실행되었다면 위와 같은 화면이 등장함

※ 실행 도중 아래와 같은 에러 메세지가 등장할 수 있음
<img src=https://github.com/daeun1022/ewhafallcapston/blob/main/Images/%EC%8B%A4%ED%96%89_%EC%97%90%EB%9F%AC%EB%A9%94%EC%84%B8%EC%A7%80.png>
이는 Webpack Dev Server 내부 설정(onBeforeSetupMiddleware, onAfterSetupMiddleware)에서 발생한 사용 중단(Deprecated) 경고로서 오래된 옵션을 사용 중이라는 알림일 뿐, 실행에는 영향을 주지 않으며 Build는 정상적으로 실행됨

## How to Test
📌  이메일 주소를 이용해 회원가입을 완료한 후, 로그인하여 챗봇과의 대화를 시작한다.<br>
📌  충분한 대화를 나눈 뒤에는 일기 페이지로 이동하여, AI가 생성한 일기 내용과 감정 분석 결과를 확인한다.<br>
📌  필요하다면 캘린더 화면으로 이동해 시각적으로 표현된 한 달간의 감정 변화를 점검할 수 있다.

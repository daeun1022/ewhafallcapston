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
```
ewhafallcapston/FrontEnd_Chat/frontend/src/
│   ├── components/ui                                     
│   │   ├── button.js                        # Button Component의 구조 저장
│   │   ├── card.js                          # Card Component의 구조 저장
│   │   ├── input.js                         # Input Component의 구조 저장
│   ├── App.js                               # 채팅 화면. AI 챗봇 제공 및 대화 진행
│   ├── App.css                              # ???
│   ├── App.test.js                          # ???
│   ├── Calendar.js                          # 캘린더 화면. 
│   ├── Calendar.css                         # ???
│   ├── Diary.js                             # 일기 화면. 채팅 내용을 기반으로 한 일기 생성 및 감정 분석 진행
│   ├── Diary.css                            # ???
│   ├── Firebase.js                          # ???
│   ├── Index.js                             # ???
│   ├── Index.css                            # ???
│   ├── LineChart.js                         # 캘린더 화면에 Line Chart 제공. 
│   ├── LineChart.css                        # ???
│   ├── Login.js                             # 인트로 화면. 파이어베이스의 유저 데이터를 기반으로 한 로그인 기능 제공
│   ├── Login.css                            # ???
│   ├── ReportWebVitals.js                   # ???
│   ├── SetupTests.js                        # ???
│   ├── Signup.js                            # 회원가입 화면. 이메일을 기반으로 한 유저 등록 기능 제공
│   ├── Signup.css                           # ???
├── .env                                     # OpenAI server 에 연결하기 위한 OpenAPI key 저장
```
## How to Build

## How to Install

## How to Test

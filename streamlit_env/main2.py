import os
import json

import streamlit as st
import openai

if 'page' not in st.session_state:
    st.session_state['page'] = 'main'
    
def navigate_to(page):
    st.session_state['page'] = page
    st.rerun()
    
# configuring openai - api key
working_dir = os.path.dirname(os.path.abspath(__file__))
config_data = json.load(open(f"{working_dir}/config.json"))
OPENAI_API_KEY = config_data["OPENAI_API_KEY"]
openai.api_key = OPENAI_API_KEY

# configuring streamlit page settings
st.set_page_config(
    page_title="Chatbot Site",
    layout="centered"
)

# initialize chat session in streamlit if not already present
if "chat_history" not in st.session_state:
    st.session_state.chat_history = []
    
st.markdown(
    """
<style>
    .st-emotion-cache-1c7y2kd {
        flex-direction: row-reverse;
        text-align: right;
        background-color: #565A5D;
    }
    
    .st-emotion-cache-4oy321 {
        border : 1px solid black;
    }
    
    .st-emotion-cache-1c7y2kd p{
        color : #FFFFFF;
    }
</style>
""",
    unsafe_allow_html=True,
)

    # 메인 페이지 내용 정의
def main_page():
    if st.button('일기 작성하러 가기'):
        navigate_to('sub')

    # streamlit page title
    st.title("EmotionBot Diary")

    # display chat history
    for message in st.session_state.chat_history:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])

    # input field for user's message
    user_prompt = st.chat_input("하고싶은 말을 적어주세요")

    if user_prompt:
        # add user's message to chat and display it
        st.chat_message("user").markdown(user_prompt)
        st.session_state.chat_history.append({"role": "user", "content": user_prompt})

        # send user's message to GPT-4o and get a response
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content":
                    "사용자는 자신의 감정을 잘 파악하지 못하고, 왜 그런 감정을 느끼는지 그 원인을 알지 못하는 상태임. 내가 해야 할 역할은 그런 사용자와 친밀하게 대화하면서 사용자가 어떤 감정을 느끼고 있는지, 왜 그런 감정을 느끼는지 원인을 분석하는 것이다 "
                    "너는 대화에서 질문을 줄이고, 관찰이나 진술을 사용해 상대방이 스스로 더 많이 이야기할 수 있도록 도와줘. "
                    "대화 예시는 상대방: 오늘 좀 피곤하네. 너: 피곤한 하루였구나. 무슨 일이 있었어? 상대방: 일이 많아서 스트레스를 좀 받았어. 너: 스트레스 많이 받았겠다. 그런 상황에서 쉬는 시간을 가지는 게 중요하지. "
                    "대화에서 상대방이 특정 사건이나 상황을 언급하면, 그 이유를 자연스럽게 묻도록 해. 예를 들어, '오늘 늦잠 자서 수업을 놓쳤어'라는 말이 나오면 '왜 늦잠을 잤어?' 같은 방식으로 대화의 이유를 탐구해."
                    "상대방이 '늦잠을 잤다', '어려운 일이 있었다' 등 원인이 있을 법한 상황을 언급하면, 그 이유를 묻는 질문을 던져. 질문은 '왜', '어떻게', '무슨 이유로' 등의 단어로 시작하도록 해."
                    "질문을 최소화하고, 꼭 필요한 경우에만 짧고 구체적으로 해. "
                    "사용자의 문제 해결을 위한 해결책을 제안하는 것은 최소화 할 것 "
                    "사용자가 직접적으로 자신의 기분이나 상태를 표현한 경우, 왜 그런 기분을 느꼈는지 이유를 묻는 질문을 해줄 것 "
                    "사용자가 자신의 감정의 원인을 알았다면 더이상 질문하지 말고 이를 이해하고 공감해 줄 것 "
                    "반말로 대화를 진행할 것 "
                    "이모티콘을 사용하지 않을 것 "
                    },
                *st.session_state.chat_history
            ]
        )

        assistant_response = response.choices[0].message.content
        st.session_state.chat_history.append({"role": "assistant", "content": assistant_response})

        # display GPT-4o's response
        with st.chat_message("assistant"):
            st.markdown(assistant_response)
            
    # OpenAI API를 사용한 요약 생성 함수
def summarize_conversation(chat_history):
    try:
        # 대화 내용을 요약하기 위해 OpenAI 모델 호출
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": 
                    "당신은 도움이 되는 어시스턴트입니다. "
                    "다음 대화를 한국어로 된 간결한 일기 항목으로 요약하세요."
                    "사용자의 입장에서 1인칭 서술을 하세요. "
                    "유저나 사용자가 아니라 나는 이라는 표현을 사용하세요 "},
                {"role": "user", "content": "\n".join([f"{msg['role']}: {msg['content']}" for msg in chat_history])}
            ]
        )
        summary = response.choices[0].message.content
        return summary
    except Exception as e:
        return f"요약 중 오류가 발생했습니다: {e}"

            
# 서브 페이지 내용 정의
def sub_page():
    st.title('일기 페이지')
    st.write('챗봇과의 대화 내용을 기반으로 일기가 작성됩니다')
    if st.button('대화 다시보기'):
        navigate_to('main')
    
    # 요약 생성
    if "summary" not in st.session_state:
        st.session_state["summary"] = summarize_conversation(st.session_state.chat_history)

    # 요약 내용 표시
    st.write('### 요약된 일기:')
    st.write(st.session_state["summary"])
    
if st.session_state['page'] == 'main':
    main_page()
elif st.session_state['page'] == 'sub':
    sub_page()

import streamlit as st
from langchain_core.messages import ChatMessage
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
import os 

st.markdown(
    """
<style>
    .st-emotion-cache-1c7y2kd {
        flex-direction: row-reverse;
        text-align: right;
        background-color: #565A5D;
    }
    
    .st-emotion-cache-1c7y2kd p{
        color : #FFFFFF;
    }
</style>
""",
    unsafe_allow_html=True,
)

# API KEY 설정
os.environ["OPENAI_API_KEY"] = st.secrets["OPENAI_API_KEY"]

# session state 에 저장
if "messages" not in st.session_state:
    st.session_state["messages"]=[]

# 채팅 대화기록을 저장
if "store" not in st.session_state:
    st.session_state["store"]=dict()

# 새로고침 전에 session state에서 꺼내오기
if "messages" in st.session_state and len(st.session_state["messages"]) > 0:
    for chat_message in st.session_state["messages"]:
        st.chat_message(chat_message.role).write(chat_message.content)


# 세션 ID를 기반으로 세션 기록을 가져오는 함수
def get_session_history(session_ids: str) -> BaseChatMessageHistory:
    if session_ids not in st.session_state["store"]: # 세션 ID가 store에 없는 경우
        # 새로운 ChatMessageHistory 객체를 생성하여 store에 저장
        st.session_state["store"][session_ids] = ChatMessageHistory()
    return st.session_state["store"][session_ids]  # 해당 세션 ID에 대한 세션 기록 반환

# 사용자의 입력
if user_input := st.chat_input("메세지를 입력해주세요"):
    st.chat_message("user").write(f"{user_input}")
    st.session_state["messages"].append(ChatMessage(role="user", content=user_input))
    
    # LLM을 사용하여 AI의 답변 생성
    
    # 모델 생성
    model = ChatOpenAI()
    
    # 프롬프트 생성
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "사용자의 감정을 공감하고 이해해주기.",
            ),
            # 대화 기록을 변수로 사용, history 가 MessageHistory 의 key 가 됨
            MessagesPlaceholder(variable_name="history"),
            ("human", "{question}"),  # 사용자 질문을 변수로 사용
        ]
    )

    chain = prompt | model

    chain_with_memory = (
        RunnableWithMessageHistory(  # RunnableWithMessageHistory 객체 생성
            chain,  # 실행할 Runnable 객체
            get_session_history,  # 세션 기록을 가져오는 함수
            input_messages_key="question",  # 사용자 질문의 키
            history_messages_key="history",  # 기록 메시지의 키
        )
    )
        
    response = chain_with_memory.invoke(
        {"question": user_input},
        # 설정 정보로 세션 ID "abc123"을 전달합니다.
        config={"configurable": {"session_id": "abc123"}}
    )

    assistant_output = response.content
        
    # AI의 출력
    with st.chat_message("assistant"):
        st.write(assistant_output)
        st.session_state["messages"].append(ChatMessage(role="assistant", content=assistant_output))
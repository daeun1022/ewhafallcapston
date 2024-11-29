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
    page_title="GPT-4o Chat",
    layout="centered"
)

# initialize chat session in streamlit if not already present
if "chat_history" not in st.session_state:
    st.session_state.chat_history = []

x = 30

    # 메인 페이지 내용 정의
def main_page():
    if st.button('서브 페이지로 이동'):
        navigate_to('sub')
        
    x = 50

    # streamlit page title
    st.title("🤖 GPT-4o - ChatBot")

    # display chat history
    for message in st.session_state.chat_history:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])


    # input field for user's message
    user_prompt = st.chat_input("Ask GPT-4o...")

    if user_prompt:
        # add user's message to chat and display it
        st.chat_message("user").markdown(user_prompt)
        st.session_state.chat_history.append({"role": "user", "content": user_prompt})

        # send user's message to GPT-4o and get a response
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content":
                    "You are an assistant who can grasp emotions. " 
                    "You can empathize with the user's emotions. "
                    "You can see what kind of emotions client has through the conversation with her. "
                    "Please dig into what the other person is saying in more detail."
                    "반말을 사용해줘 "},
                *st.session_state.chat_history
            ]
        )

        assistant_response = response.choices[0].message.content
        st.session_state.chat_history.append({"role": "assistant", "content": assistant_response})

        # display GPT-4o's response
        with st.chat_message("assistant"):
            st.markdown(assistant_response)
            
# 서브 페이지 내용 정의
def sub_page():
    st.title('서브 페이지')
    st.write('여기는 서브 페이지입니다.')
    if st.button('메인 페이지로 돌아가기'):
        navigate_to('main')
    st.write(x)


if st.session_state['page'] == 'main':
    main_page()
elif st.session_state['page'] == 'sub':
    sub_page()

import streamlit as st
from streamlit_when2meet import streamlit_when2meet

# Add some test code to play with the component while it's in development.
# During development, we can run this just as we would any other Streamlit
# app: `$ streamlit run streamlit_when2meet/example.py`

st.subheader("Component with constant args")

# Create an instance of our component with a constant `name` arg, and
# print its output value.
data = streamlit_when2meet(disabled=True, initial_data=[[5, 49950, 77550], [2, 44400, 81450], [3, 56700, 86250], [4, 59100, 97200]])

st.markdown(data)
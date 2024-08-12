from fastapi import FastAPI
from langchain.document_loaders import UnstructuredPDFLoader, OnlinePDFLoader, WebBaseLoader, YoutubeLoader, DirectoryLoader, TextLoader, PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from sklearn.metrics.pairwise import cosine_similarity
from langchain_pinecone import PineconeVectorStore
from langchain.embeddings import OpenAIEmbeddings
from langchain_community.embeddings import HuggingFaceEmbeddings
from google.colab import userdata
from pinecone import Pinecone
from openai import OpenAI
import numpy as np
import tiktoken
import os
from dotenv import load_dotenv

app = FastAPI()

# @app.get("/")
# def health_check():
#    return "check complete"

@app.post("/response/")
async def ai_response(test: str):
   # load_dotenv()

   # pinecone_api_key = userdata.get("PINECONE_API_KEY")
   # os.environ['PINECONE_API_KEY'] = pinecone_api_key

   # openai_api_key = userdata.get("OPENAI_API_KEY")
   # os.environ['OPENAI_API_KEY'] = openai_api_key
   return os.getenv('GEMINI_API_KEY')
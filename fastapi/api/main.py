from pathlib import Path
from fastapi import FastAPI
from langchain.document_loaders import UnstructuredPDFLoader, OnlinePDFLoader, WebBaseLoader, YoutubeLoader, DirectoryLoader, TextLoader, PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from sklearn.metrics.pairwise import cosine_similarity
from langchain_pinecone import PineconeVectorStore
from langchain.embeddings import OpenAIEmbeddings
from langchain_community.embeddings import HuggingFaceEmbeddings
# from google.colab import userdata
from pinecone import Pinecone
from openai import OpenAI
import numpy as np
import tiktoken
import os
from dotenv import load_dotenv
import google.generativeai as genai

app = FastAPI()

@app.get("/")
def health_check():
   return "check complete"

@app.post("/response/")
async def ai_response(test: str):
   dotenv_path = Path('../../.env.local')
   load_dotenv(dotenv_path=dotenv_path)
   text = "This is a test document."

   hf_embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
   query_result = hf_embeddings.embed_query(text)

   openrouter_client = OpenAI(
      base_url="https://openrouter.ai/api/v1",
      api_key=os.getenv("OPENROUTER_API_KEY")
   )

   tokenizer = tiktoken.get_encoding('p50k_base')

   # create the length function
   def tiktoken_len(text):
      tokens = tokenizer.encode(
         text,
         disallowed_special=()
      )
      return len(tokens)

   text_splitter = RecursiveCharacterTextSplitter(
      chunk_size=2000,
      chunk_overlap=100,
      length_function=tiktoken_len,
      separators=["\n\n", "\n", " ", ""]
   )

   def get_embedding(text, model="text-embedding-3-small"):
      # Call the OpenAI API to get the embedding for the text
      response = hf_embeddings.embed_query(text)
      return response.data[0].embedding

   def cosine_similarity_between_words(sentence1, sentence2):
      # Get embeddings for both words
      embedding1 = np.array(get_embedding(sentence1))
      embedding2 = np.array(get_embedding(sentence2))

      # Reshape embeddings for cosine_similarity function
      embedding1 = embedding1.reshape(1, -1)
      embedding2 = embedding2.reshape(1, -1)

      print("Embedding for Sentence 1:", embedding1)
      print("\nEmbedding for Sentence 2:", embedding2)

      # Calculate cosine similarity
      similarity = cosine_similarity(embedding1, embedding2)
      return similarity[0][0]
   
   loader = YoutubeLoader.from_youtube_url("https://www.youtube.com/watch?v=e-gwvmhyU7A", add_video_info=True)
   data = loader.load() 
   texts = text_splitter.split_documents(data)
   vectorstore = PineconeVectorStore(index_name="headstarter-demo", embedding=hf_embeddings)

   index_name = "headstarter-demo"

   namespace = "youtube-videos-2"
   
   vectorstore_from_texts = PineconeVectorStore.from_texts([f"Source: {t.metadata['source']}, Title: {t.metadata['title']} \n\nContent: {t.page_content}" for t in texts], hf_embeddings, index_name=index_name, namespace=namespace)


   # Initialize Pinecone
   pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"),)

   # Connect to your Pinecone index
   pinecone_index = pc.Index("ai-assistant")
   query = "What does Aravind mention about pre-training and why it is important?"

   raw_query_embedding = hf_embeddings.embed_query(query)

   query_embedding = raw_query_embedding.data[0].embedding
   top_matches = pinecone_index.query(vector=query_embedding, top_k=10, include_metadata=True, namespace=namespace)
   # Get the list of retrieved texts
   contexts = [item['metadata']['text'] for item in top_matches['matches']]

   augmented_query = "<CONTEXT>\n" + "\n\n-------\n\n".join(contexts[ : 10]) + "\n-------\n</CONTEXT>\n\n\n\nMY QUESTION:\n" + query

   # Modify the prompt below as need to improve the response quality

   primer = f"""You are a personal assistant. Answer any questions I have about the Youtube Video provided.
   """

   #Gemini 
   # genai.configure(api_key=os.environ["GEMINI_API_KEY"])

   # model = genai.GenerativeModel('gemini-1.5-flash')

   # response = model.start_chat(
   #    history=[
   #       {"role": "user", "parts": primer},
   #       {"role": "user", "parts": augmented_query},
   #    ]
   # )

   res = openrouter_client.chat.completions.create(
      model="mistralai/mistral-nemo",
      messages=[
         {"role": "system", "content": primer},
         {"role": "user", "content": augmented_query}
      ]
   )

   answer = res.choices[0].message.content
   

   return answer
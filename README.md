# Arabic tutor AI

An agent to help you learn Arabic using Gemini API. 

Deployed as a subdomain at [assistant.rehanmohideen.com](https://assistant.rehanmohideen.com) using AWS EC2 ubuntu, cammy.

### In Progress:
- Implementing RAG on the server using Python, hugging face open router api, llama 3.1 model, OpenAI, LangChain, Pinecone, fastapi
- Need to add a pipeline for easy auto deployment (instead of manual rsync)

## local Dev

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.
Uses Material UI


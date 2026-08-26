# 🎓 Pak University Advisor (پاکستان یونیورسٹی ایڈوائزر)

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://pak-university-advisor.vercel.app/)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

An intelligent, bilingual (**English & Urdu**), data-driven platform empowering Pakistani students and parents to discover, compare, and get AI-assisted admissions & scholarship recommendations for **260+ recognized higher education institutions in Pakistan**.

---

## 🌟 Key Features

| Feature | Description |
|---|---|
| 🤖 **RAG AI Admissions Counselor** | Real-time Retrieval-Augmented Generation AI chat grounded in official Pakistani university data & HEC/USAID guidelines |
| 🔍 **Budget-Aware Search** | Filter 260+ universities by annual tuition budget (PKR), city, province, sector (Public/Private), and degree programs |
| 💰 **Scholarship Pathway Matching** | Smart fallback displaying HEC Need-Based & USAID MNBSP tuition waivers when private fees exceed budget |
| ⚖️ **Side-by-Side Comparison** | Compare up to 4 universities simultaneously on fees, rankings, financial aid offices, and degrees |
| 📌 **Shortlisting** | Save promising institutions to your personal shortlist with NextAuth session sync |
| 🌐 **Bilingual (English & Urdu RTL)** | Native right-to-left layout and complete translations (/en, /ur) |
| 🔑 **Secure Authentication & Reset** | Full Auth.js v5 JWT auth, sign up, login, and Resend email password reset |

---

## 🚀 RAG (Retrieval-Augmented Generation) Architecture

The application uses an **offline pre-computed TF-IDF vector index** coupled with hybrid Cosine Similarity retrieval to achieve sub-30ms vector search inside serverless functions without external vector database fees.

`mermaid
graph TD
    A[Student Natural Language Query] --> B[RAG API /api/rag-chat]
    B --> C[Hybrid Vector Engine src/lib/rag-retrieval.ts]
    C -->|Metadata Filters + Vector Cosine Search| D[University Vector Index 266 Institutions]
    D -->|Top 5 Fact Chunks| E[OpenRouter Gemini LLM Prompt]
    E --> F[Bilingual Answer + Interactive Citation Cards]
`

---

## 🛠️ Technology Stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript 5
- **Styling**: Tailwind CSS 4, Radix UI, Lucide Icons, Glassmorphism design system
- **Localization**: 
ext-intl (English & Urdu RTL)
- **Vector Search & RAG**: Cosine Similarity vector store + OpenRouter AI (google/gemini-2.0-flash-lite-001:free)
- **Authentication**: Auth.js v5 (NextAuth), JWT sessions, bcryptjs
- **Database & Persistence**: Xata Client (@xata.io/client) with local filesystem & in-memory cache
- **Email Delivery**: Resend API (esend)

---

## 💻 Quick Start & Commands

### 1. Installation

`ash
git clone https://github.com/AbdulAzeemHashmi/pak-university-advisor.git
cd pak-university-advisor
npm install
`

### 2. Generate RAG Vector Embeddings

`ash
npm run generate-embeddings
`

### 3. Start Development Server

`ash
npm run dev
`

Open [http://localhost:3000/en](http://localhost:3000/en) or [http://localhost:3000/ur](http://localhost:3000/ur).

---

## 🔑 Environment Variables (.env.local)

`env
# Auth Secret (JWT Signing)
AUTH_SECRET=your-random-long-secret-key

# OpenRouter AI (RAG & Recommendations)
OPENROUTER_API_KEY=sk-or-v1-your-openrouter-key

# Resend Email (Password Reset Delivery)
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL="Pak University Advisor <onboarding@resend.dev>"

# Xata Database (Optional for Production Persistence)
XATA_BRANCH=main
XATA_API_KEY=your_xata_api_key
XATA_DATABASE_URL=your_xata_database_url
`

---

## 📑 API Reference

| Route | Method | Description |
|---|---|---|
| /api/rag-chat | POST | RAG hybrid retrieval & AI Q&A |
| /api/universities | GET | Search, filter, and paginate universities |
| /api/scholarships | GET | Retrieve HEC & USAID partner institutions |
| /api/ai-recommend | POST | Structured university recommendation |
| /api/shortlist | GET, POST, DELETE | Read & update shortlist items |
| /api/auth/signup | POST | Register a new student account |
| /api/auth/forgot-password | POST, GET | Generate & verify password reset codes |
| /api/auth/reset-password | POST | Set new password with OTP code |

---

## 📜 License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.

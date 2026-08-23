# 🇵🇰 Pak University Advisor

> A full-stack, bilingual (English/Urdu) web application to help Pakistani students find their ideal university based on budget, city location, degree preference, and 100% free HEC & USAID need-based scholarship eligibility.

---

## 🎯 Overview & Key Features

- **🎓 University Search & Filter:** Search over 260+ HEC-recognized institutions filtered by max fee budget, city, province, sector type (Public/Private), and degree offerings.
- **💡 Smart Budget Fallback:** If a student's budget is below available private tuition, the app automatically surfaces regional universities offering full HEC Need-Based & USAID MNBSP scholarships with Financial Aid Office contacts.
- **🌐 Bilingual & RTL Support:** Seamless toggle between English (LTR) and Urdu (RTL) across the entire UI and AI counselor guidance.
- **🤖 OpenRouter AI Counselor:** AI-driven personalized university & financial aid recommendations powered by free models (Gemini / Llama).
- **⚖️ Side-by-Side Comparison:** Compare up to 4 selected universities side-by-side on fee structure, ranking, programs, and aid coverage.
- **❤️ Shortlist & User Accounts:** Secure credentials authentication powered by Auth.js (v5) with personal shortlist dashboard.

---

## 🛠️ Tech Stack (100% Free Tier, No Credit Card Required)

| Layer | Technology | Details |
|-------|------------|---------|
| **Framework** | Next.js 15 (App Router) | React 19 + TypeScript |
| **Styling** | Tailwind CSS 4 | Pakistani Green `#01411C`, Islamic Green `#1A8F3C`, Accent Gold `#F5A623`, Glassmorphism |
| **UI Components** | shadcn/ui + Lucide Icons | Accessible, responsive components |
| **Database** | Xata.io | PostgreSQL serverless platform + local dataset JSON fallback |
| **Authentication** | Auth.js (NextAuth v5) | Credentials & session handling |
| **Localization** | next-intl | Bilingual (EN/UR) with full RTL support |
| **AI Integration** | OpenRouter API | Free AI models (Gemini / Llama) |
| **Email** | Resend | Password reset email notifications |
| **Deployment** | Vercel | Hobby Tier |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Python 3.8+ (for data processing scripts)

### Installation

```bash
# Clone the repository
git clone https://github.com/AbdulAzeemHashmi/pak-university-advisor.git
cd pak-university-advisor

# Install dependencies
npm install

# Run dataset merging script
python scripts/merge_datasets.py

# Start development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 📂 Project Structure

```
pak-university-advisor/
├── data/                      # Raw and processed dataset CSVs/JSONs
├── scripts/                   # Data merging, scraping, and seeding scripts
├── src/
│   ├── app/
│   │   ├── [locale]/          # Bilingual routes (en/ur)
│   │   │   ├── page.tsx       # Landing Home page
│   │   │   ├── universities/  # Search & filter page
│   │   │   ├── compare/       # University comparison
│   │   │   ├── shortlist/     # User shortlist
│   │   │   ├── profile/       # User profile
│   │   │   └── auth/          # Login, signup, password reset
│   │   └── api/               # API routes (universities, scholarships, ai-recommend, shortlist)
│   ├── components/            # UI components (SidePanel, FilterBar, Cards, AI Modal, Switcher)
│   ├── lib/                   # Database accessor, Auth.js, Xata client, utilities
│   ├── messages/              # en.json and ur.json translations
│   └── types/                 # TypeScript interfaces
```

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for details.
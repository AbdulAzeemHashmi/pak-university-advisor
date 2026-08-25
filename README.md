<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=0,2,2,5,30&height=200&section=header&text=Pak%20University%20Advisor&fontSize=42&fontColor=ffffff&fontAlignY=38&desc=%F0%9F%87%B5%F0%9F%87%B0%20Find%20your%20university%2C%20your%20way&descAlignY=58&descSize=18&animation=twinkling" alt="Pak University Advisor Header" width="100%">

<br/>

<p>
  <a href="https://pak-university-advisor.vercel.app"><img src="https://img.shields.io/badge/Live%20Demo-pak--university--advisor.vercel.app-01411C?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo"></a>
  <a href="https://github.com/AbdulAzeemHashmi/pak-university-advisor"><img src="https://img.shields.io/github/stars/AbdulAzeemHashmi/pak-university-advisor?style=for-the-badge&color=F5A623&labelColor=01411C&logo=github" alt="GitHub Stars"></a>
  <img src="https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js 15">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript 5">
  <img src="https://img.shields.io/badge/Deployed-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Deployed on Vercel">
</p>

<img src="https://readme-typing-svg.demolab.com?font=Space+Grotesk&weight=700&size=22&duration=2800&pause=900&color=1A8F3C&center=true&vCenter=true&width=750&lines=Search+250%2B+Pakistani+universities;Filter+by+budget%2C+city+%26+program;Discover+HEC+%26+USAID+scholarships;AI-powered+bilingual+recommendations;English+%2B+%D8%A7%D8%B1%D8%AF%D9%88+RTL+support" alt="Animated project highlights">

<br/>

> **Open source platform helping Pakistani students discover universities, compare options, and unlock scholarship pathways.**

</div>

---

## ?? What Problem Does This Solve?

Choosing a university in Pakistan means digging through dozens of websites for fees, locations, programs, and scholarship eligibility. For students with limited budgets, this process is overwhelming and often results in missed opportunities.

**Pak University Advisor** centralizes all of this into a single bilingual experience. Students discover realistic options, understand their tradeoffs, and find a practical next step rather than guessing in the dark.

> **Important:** University fees and scholarship availability change frequently. Use this platform as a discovery and planning tool, then confirm details directly with institutions and scholarship providers.

---

## ? Features at a Glance

| Feature | What It Does |
|---|---|
| ?? **University Discovery** | Search 250+ recognized institutions by name, city, province, sector, degree, and distance learning |
| ?? **Budget Aware Filtering** | Filter universities whose annual fees fit within your PKR budget |
| ?? **Scholarship Fallback** | When no direct match exists, surface HEC and USAID scholarship pathway institutions |
| ?? **AI Advisor** | Get personalized bilingual recommendations powered by OpenRouter |
| ?? **Side by Side Comparison** | Compare universities on fees, programs, rankings, location, and aid |
| ?? **Shortlists** | Save promising universities to a personal shortlist |
| ?? **English and Urdu** | Full bilingual support with right-to-left Urdu layouts |
| ?? **Accounts** | Register, sign in, manage your profile, and reset your password |
| ?? **Smart Search** | Recognizes acronyms like FAST, NUCES, NUST, LUMS, UET, COMSATS, GIKI, IBA, GCU, and more |

---

## ??? User Journey

```mermaid
flowchart LR
    A[?? Open App] --> B[?? Sign In or Register]
    B --> C[?? Search Universities]
    C --> D{?? Fits Budget?}
    D -->|Yes| E[?? University Matches]
    D -->|No| F[?? Scholarship Options]
    E --> G[?? Compare]
    F --> G
    G --> H[?? Add to Shortlist]
    H --> I[?? Get AI Recommendation]
```

---

## ??? Technology Stack

| Layer | Technologies |
|---|---|
| ??? **Framework** | Next.js 15 App Router, React 19, TypeScript 5 |
| ?? **Styling** | Tailwind CSS 4, PostCSS, Pakistani green and gold design system |
| ?? **Components** | Radix UI, shadcn/ui patterns, Lucide React icons |
| ?? **Routing and i18n** | next-intl, locale routes for `en` and `ur`, full RTL support |
| ?? **Data** | Processed CSV and JSON university datasets, local data access layer |
| ?? **Auth** | Auth.js v5, JWT sessions, stateless HMAC OTP password reset |
| ?? **AI** | OpenRouter API (free Gemini model) with bilingual local fallback |
| ?? **Email** | Resend API for password reset delivery, on-screen OTP fallback |
| ?? **Deployment** | Vercel with `/tmp` storage adapter for serverless filesystem compatibility |
| ?? **Dev Tools** | ESLint, TypeScript strict mode, Python data preparation scripts |

---

## ?? Quick Start

### Requirements

- Node.js 20 or newer
- npm
- Python 3.8 or newer (for dataset preparation)

### Install and Run

```bash
git clone https://github.com/AbdulAzeemHashmi/pak-university-advisor.git
cd pak-university-advisor
npm install
python scripts/merge_datasets.py
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Locale routes are at `/en` and `/ur`.

### Available Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the local development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run the configured linter |
| `python scripts/merge_datasets.py` | Merge source university CSV datasets |

---

## ?? Configuration

Create a `.env.local` file for external services. The app has local fallbacks for most features, so you can explore the interface without every key configured.

```env
AUTH_SECRET=replace-with-a-long-random-secret
OPENROUTER_API_KEY=your-openrouter-key
RESEND_API_KEY=your-resend-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Configuration Notes

- `OPENROUTER_API_KEY` enables real AI recommendations. Without it, a bilingual heuristic response from local data is returned.
- `RESEND_API_KEY` enables email delivery for password resets. Without it, a 6-digit code is displayed on-screen so users can still reset their password.
- `AUTH_SECRET` is used for JWT signing and stateless OTP verification. Use a long, random string in production.
- Never commit `.env.local` or expose server-only keys in client code.

---

## ?? API Reference

| Endpoint | Method | Responsibility |
|---|---|---|
| `/api/universities` | `GET` | Search, filter, and paginate universities |
| `/api/scholarships` | `GET` | Return scholarship linked institutions |
| `/api/ai-recommend` | `POST` | Generate a personalized bilingual recommendation |
| `/api/shortlist` | `GET`, `POST`, `DELETE` | Read and update a user shortlist |
| `/api/auth/[...nextauth]` | Auth.js | Session and credential authentication |
| `/api/auth/forgot-password` | `POST`, `GET` | Request and verify reset OTPs |
| `/api/auth/reset-password` | `POST` | Complete a password reset |

---

## ?? Project Structure

```text
pak-university-advisor/
+-- data/
¦   +-- processed/                  # Merged master CSV and JSON data
¦   +-- scholarship_lists/          # HEC and USAID scholarship source lists
+-- scripts/
¦   +-- merge_datasets.py           # Build the processed university dataset
¦   +-- scrape_hec_scholarships.py  # Collect HEC scholarship data
¦   +-- scrape_usaid_scholarships.py
+-- src/
¦   +-- app/
¦   ¦   +-- [locale]/               # Localized English and Urdu pages
¦   ¦   ¦   +-- auth/               # Login, signup, and password reset flows
¦   ¦   ¦   +-- compare/            # Side-by-side comparison page
¦   ¦   ¦   +-- profile/            # User profile and sign-out
¦   ¦   ¦   +-- shortlist/          # Saved universities
¦   ¦   ¦   +-- universities/       # Search and filtering
¦   ¦   ¦   +-- page.tsx            # Home page
¦   ¦   +-- api/                    # AI, auth, shortlist, and university APIs
¦   ¦   +-- globals.css             # Global theme, RTL, glass UI, and animations
¦   ¦   +-- layout.tsx              # Root application layout
¦   +-- components/                 # Feature components and UI primitives
¦   +-- hooks/                      # Shared React hooks
¦   +-- i18n/                       # Routing and translation configuration
¦   +-- lib/                        # Data layer, Auth.js, and utility modules
¦   +-- messages/                   # en.json and ur.json translation files
¦   +-- types/                      # Shared TypeScript models
+-- next.config.ts
+-- package.json
```

---

## ?? Data Workflow

```text
1. Place or update source CSVs in the repository root or data/ folder
2. Run: python scripts/merge_datasets.py
3. Review: data/processed/master_universities.json
4. Start the app and verify search, budget filtering, and scholarship behavior
5. Confirm fees and scholarship eligibility with official institutional sources
```

---

## ?? Contributing

1. ?? Fork the repository and create a focused branch
2. ?? Make a small, documented change matching existing TypeScript and UI patterns
3. ?? Run `npm run build` and verify data checks before opening a pull request
4. ?? Explain the user problem, implementation approach, and verification steps in the PR

Useful contribution areas include data freshness, scholarship verification, Urdu translations, accessibility improvements, and test coverage.

---

## ?? License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">

### ???? Built for students navigating higher education in Pakistan

<img src="https://readme-typing-svg.demolab.com?font=Space+Grotesk&weight=600&size=16&duration=3000&pause=1000&color=F5A623&center=true&vCenter=true&width=500&lines=Made+with+%E2%9D%A4%EF%B8%8F+for+Pakistani+students;Bilingual+%7C+Open+Source+%7C+Free+to+use" alt="Footer typing animation">

<br/>

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=0,2,2,5,30&height=100&section=footer" alt="Decorative footer wave" width="100%">

</div>

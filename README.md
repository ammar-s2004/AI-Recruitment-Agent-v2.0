<div align="center">

# 🤖 AI Recruitment Agent

### An intelligent, end-to-end AI-powered recruitment platform that automates interviews, evaluates candidates, and streamlines hiring — built by **Ammar Suratwala**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Gemini AI](https://img.shields.io/badge/Google-Gemini_AI-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Vapi](https://img.shields.io/badge/Vapi-Voice_AI-FF6B6B?style=for-the-badge)](https://vapi.ai/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

</div>

---

## 👨‍💻 About the Developer

Hi! I'm **Ammar Suratwala**, a passionate Founder/AI Engineer who loves building intelligent, real-world applications. This project is a fully customized AI recruitment platform that I built to explore the intersection of **AI, voice technology, and modern web development**.

---

## 🚀 What Is This?

**AI Recruitment Agent** is a full-stack SaaS platform that replaces traditional technical interviews with AI-driven voice interviews. It supports two types of users:

- 🏢 **Recruiters** — Create interview sessions, review candidates, manage schedules, and get AI-generated feedback reports
- 👤 **Candidates** — Upload their CV, join AI-powered voice interviews, and receive instant evaluations

The AI interviewer conducts real conversations using **voice AI (Vapi)**, evaluates answers with **Google Gemini**, and generates detailed feedback automatically.

---

## ✨ Features

### For Recruiters
- 📋 Create and manage interview sessions
- 📅 Schedule and track interviews
- 📊 View AI-generated candidate feedback & scores
- 📁 Export candidate reports to CSV
- 💳 Billing & subscription management
- ⚙️ Settings and profile management

### For Candidates
- 📤 Upload and parse CV automatically
- 🎙️ Join AI voice interviews (powered by Vapi)
- 📝 Receive instant AI feedback and scores
- 🖥️ Candidate dashboard with interview history

### Platform
- 🔐 Auth system (Login / Register)
- 🤖 AI feedback generation via Google Gemini
- 🧠 AI model configuration panel
- 📧 Email notifications via Nodemailer & EmailJS
- 🛡️ Admin panel for platform management
- 🌙 Dark mode support

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **Database** | Supabase (PostgreSQL) |
| **AI - Text** | Google Gemini AI (`@google/genai`) |
| **AI - Voice** | Vapi AI (`@vapi-ai/web`) |
| **AI - Video** | Tavus (AI video avatars) |
| **Styling** | Tailwind CSS v4 + Radix UI + shadcn |
| **Animations** | Framer Motion + Lottie |
| **Auth** | Custom auth with bcryptjs |
| **Email** | Nodemailer + EmailJS |
| **Payments** | Razorpay |
| **Deployment** | Vercel |

---

## 📦 Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project
- API keys for Gemini, Vapi, and Tavus

### Installation

```bash
# Clone the repository
git clone https://github.com/ammar-s2004/AI-Recruitment-AGENT.git

# Navigate into the project
cd AI-Recruitment-AGENT

# Install dependencies
npm install
```

### Environment Setup

Copy the example env file and fill in your own keys:

```bash
cp .env.example .env.local
```

Then edit `.env.local` with your actual API keys (see `.env.example` for all required variables).

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗂️ Project Structure

```
├── app/
│   ├── (main)/
│   │   ├── candidate/         # Candidate dashboard, interviews, CV upload
│   │   └── recruiter/         # Recruiter dashboard, scheduling, billing
│   ├── api/                   # API routes (AI feedback, admin, model)
│   ├── auth/                  # Authentication pages
│   ├── interview/             # Live interview session
│   ├── login/ & register/     # Auth pages
│   └── admin/                 # Admin panel
├── components/                # Reusable UI components
├── lib/                       # Utilities, Vapi config, helpers
├── services/                  # External service integrations
├── supabase/                  # DB schema & migrations
└── .env.example               # Environment variable template
```

---

## 🔑 Environment Variables

See [`.env.example`](.env.example) for all required environment variables. You'll need:

- `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from your Supabase project
- `SUPABASE_SERVICE_KEY` — Supabase service role key (server-side only)
- `GEMINI_API_KEY` — Google AI Studio
- `NEXT_PUBLIC_VAPI_API_KEY` — Vapi dashboard
- `TAVUS_API_KEY` — Tavus dashboard
- `NEXTAUTH_SECRET` — any long random string

---

## 🤝 Contributing

This is a personal project but feel free to fork it, open issues, or suggest improvements!

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

**Built with ❤️ by Ammar Suratwala**

[![GitHub](https://img.shields.io/badge/GitHub-ammar--s2004-181717?style=for-the-badge&logo=github)](https://github.com/ammar-s2004)

</div>

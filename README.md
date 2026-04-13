# 🌍 ReLief: Carbon Footprint & Community Action Platform

**ReLief** is a comprehensive, modern web application designed to empower individuals and communities to track, understand, and visibly reduce their carbon footprint. By combining rigorous tracking algorithms, AI-powered document scanning, gamification, and robust community features, ReLief transforms everyday habits into measurable climate progress.

---

## 🚀 Core Features

### 1. 📊 Personal Dashboard
The central hub for users to view their sustainability metrics in real-time. Features interactive charts detailing emission breakdowns (Transport, Energy, Food, Shopping) versus personalized carbon budgets.

### 2. 🧾 Resilient AI Utility Bill Scanner
A frictionless way to log energy use. Users can upload a photo of their electricity, gas, or shopping bill, and our integrated Gemini AI securely extracts consumption metrics to calculate exact carbon equivalents. 
*Note: The AI scanner is built with a resilient, dynamic model-fallback chain (`gemini-2.0-flash` → `gemini-2.5-flash` → `gemini-1.5-flash`) capable of auto-recovering from 503 high-demand errors.*

### 3. 👥 Community & Local Events
A dedicated space for climate action:
- **Global Feed:** Share achievements, tips, and articles. 
- **Groups:** Join niche sub-communities.
- **Local Events:** Discover, RSVP to, and organize local eco-initiatives like park cleanups or tree planting drives.

### 4. 🏆 Gamification & Leaderboards
Encourages healthy competition using an optimized, lag-free profile engine. Users earn "Karma Points", maintain login streaks, and unlock nature-themed Badges (e.g., "Solar Seedling") locally, nationally, and globally. 

### 5. 🌬️ Live AQI Monitoring
Real-time Air Quality Index tracking tailored to the user's location via OpenWeather & AQICN APIs, helping them stay informed about their immediate environmental conditions.

### 6. 🧠 Eco-Quiz & Education
Interactive quizzes designed to test and expand users' knowledge of sustainability, environmental science, and practical eco-tips.

---

## 💻 Tech Stack

- **Framework:** Next.js 16 (App Router) / React 19
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Clerk (`@clerk/nextjs`)
- **AI Processing:** Google Generative AI (Gemini Multimodal)
- **Emails/Notifications:** Resend API & Nodemailer
- **Styling:** Vanilla CSS Modules with custom Glassmorphism system

---

## 🎨 UI/UX Philosophy

ReLief utilizes a premium design aesthetic aimed at engaging and inspiring users, tightly focused on smooth performance:
- **Glassmorphism:** Elegant frosted-glass components matched with intense glow-shadows that react seamlessly to user actions.
- **Animations:** Extensive use of performant micro-interactions using native CSS transitions and `IntersectionObserver` scroll reveals.
- **Color Palette:** A soothing, nature-inspired palette (Emeralds, Teals, Slates, Amber).
- **Dark/Light Mode:** Integrated visual toggle for accessibility.

---

## ⚙️ How to Run Locally

### Prerequisites
- Node.js installed (v18+)
- A finalized `.env.local` configured with keys for Clerk, Supabase, Gemini, Resend, and AQI/Weather.

### Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open the platform:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

*ReLief — Technology for Planetary Health.*

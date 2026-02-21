# 🌍 ReLief: Carbon Footprint & Community Action Platform

**ReLief** is a comprehensive, modern web application designed to empower individuals and communities to track, understand, and visibly reduce their carbon footprint. By combining rigorous tracking algorithms, AI-powered document scanning, gamification, and robust community features, ReLief transforms everyday habits into measurable climate progress.

---

## 🚀 Core Features

### 1. 📊 Personal Dashboard
The central hub for users to view their sustainability metrics in real-time. Features interactive charts detailing emission breakdowns (Transport, Energy, Food, Shopping) versus personalized carbon budgets.

### 2. 🧾 AI Utility Bill Scanner
A frictionless way to log energy use. Users can upload a photo of their electricity or gas bill, and our integrated AI securely extracts consumption metrics (kWh, therms) to calculate the exact carbon equivalent without manual entry.


### 3. 👥 The Community Hub
A dedicated space for climate action:
- **Global Feed:** Share achievements, tips, and articles. 
- **Groups:** Join niche sub-communities (e.g., "NYC Cyclists", "Vegan Bakers").
- **Local Events:** Discover, RSVP to, and organize local eco-initiatives like park cleanups or tree planting drives.

### 4. 🏆 Global Leaderboards
Encourages healthy competition by ranking users based on their "Karma Points" (earned via sustainable actions) locally, nationally, and globally.

### 5. 🌬️ Live AQI Monitoring
Real-time Air Quality Index tracking tailored to the user's location, helping them stay informed about their immediate environmental conditions.

### 6. 🧠 Eco-Quiz & Education
Interactive quizzes designed to test and expand users' knowledge of sustainability, environmental science, and practical eco-tips.

---


## 💻 Tech Stack

- **Framework:** Next.js (App Router) / React
- **Language:** TypeScript
- **Styling:** CSS Modules & Vanilla CSS (custom design system, no external bloated UI libraries)
- **Authentication:** Clerk (`@clerk/nextjs`)
- **Icons:** Lucide React
- **AI Processing:** Integrated AI OCR routes

---

## 🎨 UI/UX Philosophy

ReLief utilizes a premium design aesthetic aimed at engaging and inspiring users:
- **Animations:** Extensive use of smooth, performant micro-animations using custom `ScrollReveal` wrappers and native CSS transitions.
- **Color Palette:** A soothing, nature-inspired palette (Emeralds, Teals, Slates) paired with glassmorphism effects (`backdrop-blur`).
- **Responsive:** Fluidly adapts from desktop to mobile interfaces, ensuring equal usability across devices.
- **Dark/Light Mode:** Integrated visual toggle for accessibility.

---

## ⚙️ How to Run Locally

### Prerequisites
- Node.js installed (v18+)
- Local `.env.local` configured with Clerk keys and necessary AI API keys.

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

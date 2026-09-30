# ShikshaSetu AI — Full Project Explanation

## 1. Project kya hai?

**ShikshaSetu AI** ek AI-powered education platform hai jo rural / Tier-2-3 students ke liye banaya gaya hai. "Shiksha" = education, "Setu" = bridge — yaani students aur quality education ke beech ka pul.

Isme ek hi jagah par students ko milta hai:
- AI Tutor (apni local language mein, text + voice)
- Subject-wise lessons aur quiz/test
- Offline learning (internet na ho tab bhi)
- Mentors se connect hona
- Scholarships dhundhna
- AI Career Roadmap
- Progress tracking dashboard

**Problem jo solve hoti hai:** language barrier, kam internet, guidance ki kami, aur scholarships/career ki jaankari ka na hona.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, React Router 7, Axios |
| PWA / Offline | vite-plugin-pwa (Workbox service worker), IndexedDB |
| Backend | Node.js, Express 5 (ES modules) |
| Database | MongoDB Atlas via Mongoose 9 |
| Auth | JWT (jsonwebtoken) + bcryptjs password hashing |
| AI (text) | Google Gemini (`@google/genai`, model `gemini-3.5-flash-lite`) |
| Text-to-Speech | Sarvam AI (`sarvamai`) — Indian languages ke liye; `@google-cloud/text-to-speech` bhi dependency mein hai |
| Speech-to-Text | Browser Web Speech API (`SpeechRecognition`) |

Ports: Frontend `5173`, Backend `5000`.

---

## 3. Folder Structure

```
ShikshaSetu/
├── backend/
│   └── src/
│       ├── server.js            # Express app entry, routes mount
│       ├── config/db.js         # MongoDB connection
│       ├── controllers/         # Business logic (ai, auth, login, me, mentorRequest, scholarship, tts)
│       ├── middleware/auth.middleware.js   # JWT verify
│       ├── models/              # User, MentorRequest, Scholarship
│       ├── routes/              # API route definitions
│       └── services/tts.service.js         # Sarvam TTS wrapper
└── frontend/
    └── src/
        ├── App.jsx              # Navbar + Routes
        ├── pages/               # Home, Login, Register, Dashboard, Learning, Lesson,
        │                        # AITutor, Mentors, Scholarships, Career, Progress, Offline
        ├── components/OfflineDetector.jsx
        ├── context/LanguageContext.jsx     # Global language state
        └── utils/offlineDB.js   # IndexedDB helpers
```

---

## 4. Features (detail mein)

### 4.1 Authentication & Roles
- **Register / Login** with email + password (password bcrypt se hash hota hai).
- Login par **JWT token** milta hai jo `localStorage` mein save hota hai.
- **3 roles:** `student`, `mentor`, `admin`.
- Mentor ke extra fields: `subject`, `experience`, `availability` (Available / Offline).
- User ki preferred `language` bhi save hoti hai (default Hindi).
- `GET /api/auth/me` — token se current user ki profile.

### 4.2 Multi-language Support (8 languages)
English, Hindi, Marathi, Bengali, Tamil, Telugu, Gujarati, Punjabi.
`LanguageContext` poore app mein selected language share karta hai; wahi language AI answers aur voice ke liye use hoti hai.

### 4.3 AI Tutor (`/ai-tutor`)
- Student koi bhi sawaal pooch sakta hai.
- Backend Gemini ko ek detailed prompt bhejta hai jisme selected language ke rules hote hain — answer usi language mein, simple aur step-by-step aata hai.
- **Voice Input:** mic button se bol kar sawaal poochh sakte hain (browser speech recognition).
- **Voice Output:** answer ko "suno" — Sarvam TTS answer ko audio mein convert karta hai.
- Endpoints: `POST /api/ai/ask`, `POST /api/ai/speech`.

### 4.4 Learning (`/learning`) & Lessons (`/lesson`)
- 4 subjects: **Mathematics, Science, Computer, English**.
- Har subject ke 5 topics (jaise Algebra, Physics, Web Development, Grammar...).
- Har subject card par progress bar.
- Lesson page par topic padhna aur **test/quiz** dena — score ke hisaab se feedback (jaise 4+ = great, 2+ = good).
- **Lesson download for offline:** ek button se lesson IndexedDB mein save; baad mein offline dekh sakte hain, aur remove bhi kar sakte hain.
- Lesson progress `localStorage` mein save hota hai.

### 4.5 Offline Mode (PWA)
- App **installable PWA** hai (manifest, icons, "ShikshaSetu AI").
- Service worker (Workbox) app shell cache karta hai, `navigateFallback` se offline bhi page khulta hai.
- `OfflineDetector` component internet on/off detect karta hai.
- `Offline.jsx` page — downloaded lessons dikhata hai.
- `offlineDB.js` — IndexedDB (`ShikshaSetuOfflineDB`) mein lessons save/read/delete.

### 4.6 Mentors (`/mentors`)
- Available mentors ki list (subject, experience, availability).
- Student **connection request** bhej sakta hai (custom message ke saath).
- Mentor apne aaye hue requests dekh kar **accept / reject** kar sakta hai.
- Student apni bheji hui requests aur unka status (pending / accepted / rejected) dekh sakta hai.
- Mentor apna profile update kar sakta hai; demo data ke liye seed endpoint hai.
- Endpoints: `GET /api/mentors`, `POST /api/mentors/request`, `GET /api/mentors/requests`, `GET /api/mentors/my-requests`, `PATCH /api/mentors/request/:id`, `PATCH /api/mentors/profile/:mentorId`, `POST /api/mentors/seed`.

### 4.7 Scholarships (`/scholarships`)
- Scholarships ki database-backed list: name, provider, amount, state, category, education level, income limit, deadline, required documents, official link.
- **Search & filter** (state, category, education level, etc.).
- **"Find for me"** — student apni details (category, income, level, state) daale to matching scholarships milti hain.
- Detail by ID, aur demo data seed endpoint.
- Endpoints: `GET /api/scholarships`, `/search`, `/:id`, `POST /find-for-me`, `POST /seed`.

### 4.8 AI Career Roadmap (`/career`)
- Student apni interest / goal / current education batata hai.
- Gemini ek practical **career roadmap** banata hai — options, skills, steps, resources — selected language mein.
- Endpoint: `POST /api/ai/career`.

### 4.9 Progress (`/progress`)
- Subject-wise learning progress, test scores aur overall improvement ka visual dashboard (`Progress.jsx` + `Progress.css`).

### 4.10 Dashboard
- Login ke baad student/mentor ka personal dashboard: profile info, mentor requests ka status, learning summary aur quick links.

### 4.11 Home page (`/`)
- Landing page: hero section, features overview, call-to-action (register/login).

---

## 5. Database Models (MongoDB)

**User** — `name, email (unique), password (hashed), role, language, subject, experience, availability, timestamps`

**MentorRequest** — `student (ref User), mentor (ref User), message, status (pending|accepted|rejected), timestamps`

**Scholarship** — `name, provider, description, amount, state, category[], educationLevel[], incomeLimit, deadline, documents[], officialLink, isActive, timestamps`

---

## 6. API Summary

| Method | Endpoint | Auth | Kaam |
|---|---|---|---|
| POST | `/api/auth/register` | – | Naya user |
| POST | `/api/auth/login` | – | Login, JWT |
| GET | `/api/auth/me` | JWT | Current user |
| POST | `/api/ai/ask` | – | AI Tutor answer |
| POST | `/api/ai/career` | – | Career roadmap |
| POST | `/api/ai/speech` | – | Text → audio (TTS) |
| GET | `/api/mentors` | – | Mentors list |
| POST | `/api/mentors/request` | JWT | Request bhejna |
| GET | `/api/mentors/requests` | JWT | Mentor ko aaye requests |
| GET | `/api/mentors/my-requests` | JWT | Student ki requests |
| PATCH | `/api/mentors/request/:id` | JWT | Accept/Reject |
| GET | `/api/scholarships` | – | List |
| GET | `/api/scholarships/search` | – | Search/filter |
| POST | `/api/scholarships/find-for-me` | – | Personalized match |
| GET | `/api/scholarships/:id` | – | Detail |

---

## 7. Flow (kaise kaam karta hai)

1. User register/login karta hai → JWT `localStorage` mein.
2. Language select karta hai → poore app (AI answer + voice) us language mein.
3. Learning se subject → topic → lesson padhta hai, test deta hai, chahe to lesson offline download karta hai.
4. Doubt ho to AI Tutor se text ya voice mein poochta hai.
5. Guidance ke liye mentor ko request bhejta hai, scholarships dhundhta hai, career roadmap banwata hai.
6. Progress page par apni growth dekhta hai.

---

## 8. Run kaise karein

```bash
# Backend  (backend/.env mein MONGO_URI, JWT_SECRET, GEMINI_API_KEY, SARVAM key, PORT chahiye)
cd backend
npm install
npm start            # ya npm run dev (nodemon install ho to)

# Frontend
cd frontend
npm install
npm run dev          # http://localhost:5173
```

---

## 9. Notes / Improvement ideas

- Frontend mein API URL `http://localhost:5000` kai jagah hard-coded hai — deploy ke liye `.env` (`VITE_API_URL`) use karna behtar hoga.
- `nodemon` devDependency missing hai, isliye `npm run dev` backend par fail hota hai.
- AI routes par abhi authentication / rate-limiting nahi hai — production mein add karni chahiye (API cost bachane ke liye).
- `/seed` endpoints production mein protect ya remove karne chahiye.
- Mentor request routes mein role-based access control aur strong validation add ki ja sakti hai.

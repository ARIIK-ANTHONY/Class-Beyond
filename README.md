# ClassBeyond - Education Platform

## System Description
ClassBeyond is a web-based education platform that connects students, teachers, and mentors in a collaborative learning environment. It supports lesson delivery, quizzes, mentorship, and a Q&A forum, reflecting all requirements in the SRS and system design.

## Problem Statement
Many students lack access to personalized learning, mentorship, and interactive resources. Existing solutions are fragmented, making it hard for students to get help, track progress, or connect with mentors.

## Why is it a Problem?
- Students struggle to find reliable help and resources.
- Teachers lack tools to monitor progress and deliver interactive lessons.
- Mentors have no centralized way to support students.

## Proposed Solution
ClassBeyond provides:
- A student portal for lessons, quizzes, mentorship requests, and Q&A.
- A teacher portal for lesson creation, quiz management, and student tracking.
- A mentor portal for answering questions and managing mentorship sessions.
- Admin features for lesson approval and notifications.

## Demo
See the video demo: [Google Drive Video Link](YOUR_VIDEO_LINK_HERE)

## Setup Instructions

### Prerequisites
- Node.js (v18+ recommended)
- npm (v9+ recommended)
- PostgreSQL database (Neon or local)
- Firebase project (for authentication)


### 1. Clone the Repository
```powershell
git clone https://github.com/ARIIK-ANTHONY/Class-Beyond.git
cd Class-Beyond
```

### 2. Install Dependencies
```powershell
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory. Example:
```
DATABASE_URL=your_postgres_connection_string
PORT=3000

# Firebase Client
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

# Firebase Admin SDK (Server-side)
FIREBASE_SERVICE_ACCOUNT_KEY=your_service_account_json
```
See `FIREBASE_SETUP_GUIDE.md` for details.

### 4. Database Migration
Run migrations to set up the database schema:
```powershell
npm run migrate
```

### 5. Start the Development Server
```powershell
npm run dev
```
The app will be available at [http://localhost:3000](http://localhost:3000).

### 6. Deployment
- Deploy the frontend and backend to Vercel, Netlify, or your preferred platform.
- Ensure your database and Firebase credentials are set in the production environment.

### 7. Accessing the Product
- Public URL: [YOUR_DEPLOYED_URL_HERE]
- GitHub Repo: [https://github.com/ARIIK-ANTHONY/Class-Beyond.git]
- SRS Document: [YOUR_SRS_DOCUMENT_LINK]

## Features
- Student: Lessons, quizzes, badges, mentorship, Q&A forum
- Teacher: Lesson creation, quiz management, student tracking
- Mentor: Q&A forum, mentorship management
- Admin: Lesson approval, notifications

## Actors & Processes
- Students: Learn, ask questions, request mentorship
- Teachers: Create lessons/quizzes, monitor students
- Mentors: Answer questions, manage sessions
- Admins: Approve lessons, manage notifications

## Troubleshooting
- If you see a blank page, check your `.env` setup and database connection.
- For authentication errors, verify Firebase credentials.
- For deployment, ensure all environment variables are set.

## Links
- [Demo Video](YOUR_VIDEO_LINK_HERE)
- [GitHub Repo](https://github.com/ARIIK-ANTHONY/Class-Beyond.git)
- [SRS Document](YOUR_SRS_DOCUMENT_LINK)
- [Live Product URL](YOUR_DEPLOYED_URL_HERE)

---

Replace the placeholders with your actual links and credentials. This README covers all required setup and submission instructions.

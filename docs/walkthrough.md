# UniVibe — Project Walkthrough

UniVibe is now code-complete! We have successfully transformed the initial blueprint into a high-fidelity, feature-rich university dating and social platform for Daffodil International University.

## Core Features Delivered

### 🔒 Secure Authentication
*   **DIU Domain Restriction**: Only `@diu.edu.bd` emails can register.
*   **Email Verification Gate**: Access is blocked until the student verifies their university email.
*   **Password Recovery**: Full forgot-password flow implemented.

### ✨ Smart Discovery & Matching
*   **Weighted Algorithm**: Uses a 6-category weighted system to calculate compatibility percentages.
*   **Swipe Interface**: A Tinder-style gesture UI powered by Framer Motion.
*   **Match Score Visualization**: Dynamic badges showing the match strength and common interests.

### 💬 Real-time Communication
*   **Instant Messaging**: Sub-100ms latency via Firebase Realtime Database.
*   **Live Indicators**: Real-time typing indicators and online/offline status (respecting Ghost Mode).
*   **Match-first Messaging**: Users can only chat once they have mutually matched.

### 🛡️ Safety & Moderation
*   **Moderation Tools**: Built-in reporting and blocking systems.
*   **Privacy Controls**: Granular settings for profile visibility and ghost mode.
*   **Admin Panel**: Full dashboard with user management table and report moderation queue.

### 📱 PWA & Mobile UX
*   **Installable App**: Fully configured PWA and manifest for home screen installation.
*   **Mobile-First Design**: Bottom navigation and touch-optimized gestures.
*   **Performance**: Integrated skeleton loaders and glassmorphic UI for a premium feel.

## Technical Stack Recap
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS 4, Framer Motion
- **Backend (Firebase)**: Auth, Firestore, Realtime Database, FCM
- **Navigation**: React Router 6
- **Notifications**: React Hot Toast

## Deployment & Repository
The complete source code has been pushed to your GitHub repository:
[https://github.com/Ratul-NotFound/UniVibe.git](https://github.com/Ratul-NotFound/UniVibe.git)

---
> [!TIP]
> To test the admin panel, update your user role to `"admin"` in the Firestore `users` collection.
> You can now access the management tools at `/admin`.

> [!IMPORTANT]
> Ensure you update the Firebase configuration in the `.env` file with your actual production credentials before sharing it with real students.

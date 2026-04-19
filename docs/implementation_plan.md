# UniVibe Implementation Plan

UniVibe is a private, verified campus social and dating app exclusively for Daffodil International University (DIU) students. It features interest-based matching, real-time chat, and a robust moderation system.

## User Review Required

> [!IMPORTANT]
> **Firebase Credentials**: I will need you to set up a Firebase project and provide the configuration details (API Key, Project ID, etc.) for the `.env` file. We will use a template for now.
> **Domain Restriction**: Access is strictly limited to `@diu.edu.bd` emails. This will be enforced at both the UI and Firebase Security Rules level.

## Proposed Changes

### Phase 1: Project Setup & Foundation
*   **[NEW] Project Scaffold**: Initialize Vite + React + TypeScript in `./`.
*   **[NEW] Styling**: Tailwind CSS configuration with the UniVibe design tokens (Primary: `#D4537E`, Secondary: `#378ADD`).
*   **[NEW] Folder Structure**: Establish the directory hierarchy as specified in the blueprint.
*   **[NEW] Firebase Initialization**: Set up `src/lib/firebase.ts` and Auth Context.

### Phase 2: Authentication & Domain Verification
*   **[NEW] Auth Pages**: Login, Signup (with domain check), Forget Password.
*   **[NEW] Verification Gate**: A restricted screen for users who haven't verified their DIU email.

### Phase 3: Onboarding & Profile Creation
*   **[NEW] Onboarding Wizard**: Multi-step flow for basic info, interest selection (6 categories), and photo uploads.
*   **[NEW] Profile UI**: User profile pages and editing functionality.

### Phase 4: Matching Engine & Discovery
*   **[NEW] Matching Algorithm**: Weighted interest matching logic with department bonuses (+5%).
*   **[NEW] Swipe UI**: Framer Motion-powered "Discovery" screen.

### Phase 5: Search & Browse
*   **[NEW] Browse Page**: Grid view for browsing profiles with filters (Department, Year, Interests).

### Phase 6: Real-time Chat System
*   **[NEW] Chat Rooms**: Firebase RTDB integration for sub-100ms messaging.
*   **[NEW] Features**: Typing indicators, read receipts, and image sharing.

### Phase 7: Privacy, Block & Report
*   **[NEW] Safety Layer**: Implementation of block/report features and per-field privacy toggles.

### Phase 8: Admin Panel
*   **[NEW] Admin Dashboard**: Analytics, user management, and report moderation queue.

### Phase 9: PWA & Notifications
*   **[NEW] PWA Integration**: `vite-plugin-pwa` setup for offline support and install prompts.
*   **[NEW] Notifications**: Firebase Cloud Messaging (FCM) for new matches and messages.

### Phase 10: Polish & Final Deployment
*   **[NEW] UI Enhancement**: Framer Motion transitions, skeleton loaders, and dark mode.
*   **[MOD] Security Rules**: Final production hardening of Firebase rules.

## Open Questions

1.  **AI Icebreaker**: The blueprint mentions an AI icebreaker (Anthropic API). Should I proceed with a placeholder for now or do you have an API key ready for integration?

## Verification Plan

### Automated Tests
*   **Unit Tests**: Validate the matching algorithm's weighted score calculation.
*   **Linting**: Ensure TypeScript type safety across the project.

### Manual Verification
*   **Auth Flow**: Test email verification gate and domain restriction.
*   **Responsive Design**: Verify UI on mobile-width browsers.
*   **Real-time Features**: Test chat latency and typing indicators using the browser tool.

# Skill Roulette: Firebase Authentication starter

## What this adds

- Firebase JS initialization (src/firebase.js)
- signUp(email, password, displayName), login(email, password), logout(), subscribeToAuth(callback), ensureMyProfile() (src/services/authService.js)
- getMyProfile(), updateMySkills({categories, canTeach, wantsToLearn}) (src/services/userService.js)
- Private Firestore rules for users/{uid} (firestore.rules)
- Temporary local test page at `http://localhost:5173/?auth-test=1` (src/dev/AuthDevPanel.jsx)

**This does not implement matching, chats, teacher ratings, public profiles, or age-group safety checks. It should not be deployed as a public stranger-chat site.**

## Installation (VS Code PowerShell)

1. Make sure you are in the repository root (`Beggar-Sect`) on your own feature branch (not main). Commit or stash current changes before copying, because this package overwrites `src/main.jsx`.
2. Extract the contents of the zip *into the repository root*, preserving directory structure. (`src/` should line up with the existing `src/`.)
3. If Firebase is already installed, no additional npm package is required. Otherwise: `npm install firebase`.
4. In Firebase Console, create a project; register a Web app (the `</>` icon); enable Authentication > Email/Password; create Firestore database in production mode.
5. In Firebase Console > Firestore Database > Rules: paste the contents of `firestore.rules` and **Publish**. Rules default-deny every other document.
6. Create `.env.local` in your repository root, copying keys from `.env.example` and filling in the four values from the Firebase web config object. Do not commit `.env.local`.
7. Run `npm run dev`, open `http://localhost:5173/?auth-test=1` and register a *test* account. If Vite chooses another port, use the URL Vite reports with `?auth-test=1`.
8. Test login, logout, refresh, and saving interests. Verify a `users/{uid}` document appears in Firestore.
9. Verify the *normal* website at `http://localhost:5173/` still loads unchanged.
10. `git status`, `git add src/firebase.js src/services src/dev src/main.jsx firestore.rules .env.example FIREBASE-SETUP.md`, commit on your feature branch, push, and open a pull request. Do **not** add `.env.local`.

## Troubleshooting

- `auth/operation-not-allowed` → enable Email/Password provider.
- `auth/email-already-in-use` → use an unused test email or select login.
- `auth/invalid-credential` → wrong credentials or login provider not enabled.
- `auth/weak-password` → pick a stronger test password.
- `Missing Firebase config fields` → fill in `.env.local` and restart Vite.
- `Missing or insufficient permissions` → paste/publish Firestore rules; check project ID and timestamps.
- On recent Firebase projects `localhost` is not authorized by default. In Firebase Authentication > Settings > Authorized domains, add `localhost` *only in your development project* if local auth needs it. Remove from production configurations.
- If the account appears in Authentication but a user document is missing, profile creation failed: login again and check Rules / Firestore initialization; `login` can retry missing profile creation.

## Important security boundaries

- `.env.local` keys are normal *web app configuration*, not service-account secrets; don't commit other secrets. Firebase Security Rules are the actual access control.
- Each user can read/write their own private profile only, cannot change UID or createdAt, and cannot grant themselves extra privileges or session counters.
- Matchmaking, chat, skill passports, ratings, block/report, and age-appropriate selection require separate, tested authorization rules and trusted server-side state updates before a public release.
- Firebase Authentication persists login state by default in a web browser. `subscribeToAuth` receives changes.

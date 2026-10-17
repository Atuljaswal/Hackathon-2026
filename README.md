# Skill Roulette — Social-first Hackathon Demo

A React/Vite **browser-only prototype** for spontaneous social discovery, shared interests, and optional skill activities.

**Important:** This project currently uses six fictional demo profiles. It does **not** connect real people, authenticate users, send messages to a server, or provide production-grade moderation. Chat replies and the other person's consent are simulated, and Skill Passport records live only in this browser's `localStorage`. Do not deploy it as an unrestricted stranger-chat service.

## Run locally

```bash
npm install
npm run dev
```

Visit the local URL printed by Vite. The project specifies Node `24.12.0` in `.node-version`; use a compatible Node installation if npm reports engine warnings.

## Try the experience

1. Select **Meet someone** and choose interests.
2. Preview a fictional match and enter the simulated chat.
3. Use **Next person** to end the current conversation and browse another match, or **Leave conversation** to return home; neither asks for feedback.
4. Open **Activities** to choose **Explore together**, **Share a skill**, **Ask for help**, or **Try a challenge**.
5. Preview both participants accepting. Optional prompts are not prerequisites.
6. **Stop activity · Return to chat** or **Leave conversation** at any moment, without logging anything.
7. If you *want* an activity in your Passport, select both opt-ins (the second is only a demo simulation), then click **Save experience (optional)**. The review, when offered, can also be skipped.
8. Visit **Skill Passport** to see only voluntarily recorded experiences.

## Checks

```bash
npm run test
npm run lint
npm run build
```

`npm run test` uses Node's built-in test runner for saved-activity rules. `lint` and `build` need the project's npm dependencies installed.

## Next steps before real users

Integrate Firebase/Auth (or another backend) with age-appropriate and opt-in matching, authenticated participant-only chats, session lifecycle enforcement, block/report moderation, and trusted mutual confirmation. Do not trust a browser-supplied peer confirmation or client-side progress counters. See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

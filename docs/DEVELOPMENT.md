# Skill Roulette implementation handoff

This first implementation is an explicitly labelled browser-only demo. It does not authenticate users, contact teachers, provide calling, or enforce trusted counters. Sample teacher totals are fixtures. Local storage can be altered or cleared.

## Ownership
- Developer 1: authentication, profiles, Firebase initialization, router, shared layout/styles and dependency changes.
- Developer 2: features/matching and features/sessions; replace fixture selection with atomic matching and session lifecycle.
- Developer 3: features/passport and features/confirmations; extract local chat from App into features/chat and replace it with real-time messages.

App currently coordinates demo state and session UI. Split that orchestration when adding the real backend. The empty sessions directory is reserved for that work.

## Confirmation contract
No stars, reviews or rankings. Display teaching confirmations on every teacher match card. Totals never reset. A learner can add one confirmation per teacher every rolling 24 hours, following a new completed session. Never credit the same session twice. The policy currently requires the new session to start after the previous confirmation.

Production should expose a trusted confirmTeaching(sessionId) operation. Derive learner ID from authenticated identity, load the completed session, and verify the caller was its learner and the target was its teacher. Never accept caller-supplied timestamps or totals. In one server transaction, check the session confirmation and learner/teacher cooldown, create the confirmation, update the cooldown using server time, and increment the teacher total. For a swap, model both teaching directions and a unique session/learner/teacher confirmation key. Deny direct client writes to confirmations, cooldowns and totals. Test concurrent submissions and access rules with Firebase emulators before deployment.

Suggested records: users/{uid}, sessions/{id}, sessions/{id}/messages/{id}, confirmations/{sessionLearnerTeacherKey}, confirmationCooldowns/{learnerTeacherKey}. Session fields: participant IDs, teaching roles, skill, startedAt, completedAt, status. Passport history is completed learning activity, not certified proficiency.

## Next integration steps
Configure Firebase project and Auth; implement participant-only session/message rules; add atomic queue claims and stale-entry handling; implement trusted completion and confirmation operations; replace demo state with subscriptions. Real calling needs a separate implementation; none is implied by the current chat demo.

## Checks
npm run lint
npm run build
node --test src/features/confirmations/confirmation.test.js

## Expanded demo features
- Five-minute challenges are reciprocal teaching exchanges, not solo exercises: five minutes total, default 2.5-minute turns, local messages, and independent Yes/No learning feedback. Exchanges and deadlines persist across navigation. Partner input is explicitly simulated until authenticated real-time sessions are connected. Yes respects the same directed learner/teacher 24-hour confirmation cooldown; No records feedback without changing totals. Old solo practice records are preserved as history.
- Skill Chains: local sample circles, practice/sharing contributions, and Passport entries. No remote group membership, room messaging, or presence yet.
- Skill SOS: topic selection and problem statement; only sample volunteers for that topic qualify. Problem context carries into the session.
- Cross-skill matching: teacher must offer the wanted skill and want the learner's offered skill. Completed swaps log both directions. The current teacher-confirmation flow remains for the learner's confirmation only; reciprocal live confirmations remain backend work.
- Passport: compact chronological rows, All/Shared/Practised filters, per-skill summaries. Counts are derived from actual local records, never hardcoded examples. Unique people helped comes only from completed swap partners, not group contributions or repeat confirmations.

Suggested ownership additions: Developer 1 owns challenge content and Passport profile integration; Developer 2 owns SOS and reciprocal matching; Developer 3 owns group contributions/chat and Passport logs. Resolve shared interfaces together before wiring Firebase.


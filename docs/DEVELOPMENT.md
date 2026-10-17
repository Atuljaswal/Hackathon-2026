# Skill Roulette — development handoff

## Current implementation

This repository is a **local simulated React demo**, not a functioning stranger-chat application. The existing light visual theme was retained. All mock matches come from six fictional profiles in `src/App.jsx`; messages typed in chat do not leave the device. Responses, mutual match acceptance, and the other participant's agreement to an activity are simulated. Block is local to the browser; Report displays a demo confirmation but is **not** delivered to moderators.

## Product direction

Social discovery is primary. Casual conversation is always a complete experience. Activities are optional side experiences, not a required teacher/student workflow.

**Chat controls**
- **Leave conversation:** clear the active match, in-memory messages, draft, and activity state; return home; no feedback or progress changes.
- **Next person:** perform the same cleanup, then display the next compatible fictional profile; no feedback or progress changes.
- **Report / Block:** current demo UI is labelled as simulated; a production app needs working moderation and server enforcement.

**Activities**
- **Explore together**, **Share a skill**, **Ask for help**, **Try a challenge**.
- Each activity has `none → invited → active → completed` demo states.
- `Cancel invitation` and `Stop activity · Return to chat` clear activity state without ending the chat or saving anything.
- Leaving a chat works from the main toolbar, during an invitation, during an activity, and after saving.
- Prompts/checklists are optional. No one must declare themselves a teacher, learner, or rate the session.
- Saving to Skill Passport requires *explicit* agreement from both sides. In the demo the other person's agreement is simulated. Rating is offered only after voluntarily saving an **Ask for help** activity; it remains optional.

`src/activityLogic.js` exposes two pure helpers for opt-in savings and saved experience statistics; `tests/activityLogic.test.js` verifies the basic requirements. Existing `lesson*` CSS selectors and some React state identifiers remain for compatibility with the original UI.

**Skill Passport**
- Displayed counts are LOCAL DEMO numbers, not verified credentials or proof of learning.
- `experiences saved` changes only on voluntary save, never on Next, Leave, Stop, or Skip Feedback.
- `people helped` counts unique demo profiles when the user chooses **Share a skill** and saves.
- `categories explored` counts unique categories from the saved non-share activities.
- Older local demo data uses the same storage key and persists; Reset Demo clears the stored statistics and blocked profiles.

## Developer division (3 contributors)

| Developer | Feature responsibility |
| --- | --- |
| 1 | Visual UI, onboarding, accessibility, optional activity screens |
| 2 | Auth, age-appropriate matching, invitations, trusted chat/session lifecycle, block list |
| 3 | Real-time messaging, mutually agreed activity records, Skill Passport, report review workflow |

Agree on a shared match/session schema before adding Firebase. Limit server-side session writes to the authenticated participants and use trusted transactions for matching, finalization and reputation. Prevent multiple active matches, enforce blocks and age-appropriate cohorts, and have a plan for reporting, privacy, and abuse handling before a public launch.

## Useful tests for the eventual backend

- Nobody can send messages to an ended match.
- Next and Leave end the *shared* server session and notify the other participant.
- Skipping or declining an activity does not affect profile metrics.
- A session cannot be saved unless **both** participants independently opt in.
- Third parties cannot read private messages or change session results.
- Blocked accounts and incompatible age cohorts cannot be matched.
- Reports are sent to a moderation queue rather than merely displaying a local toast.

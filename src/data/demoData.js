import { Languages, Music2, Gamepad2, Code2, Palette, Ellipsis, Users, HeartHandshake, ArrowLeftRight, Compass, Lightbulb, BookOpen, Trophy } from 'lucide-react';

export const CATEGORIES = [
  { id: 'Languages', label: 'Languages', Icon: Languages },
  { id: 'Music', label: 'Music', Icon: Music2 },
  { id: 'Gaming', label: 'Gaming', Icon: Gamepad2 },
  { id: 'Programming', label: 'Programming', Icon: Code2 },
  { id: 'Design', label: 'Art & design', Icon: Palette },
  { id: 'Other', label: 'Other skills', Icon: Ellipsis },
];

export const MODES = [
  { id: 'meet', title: 'Meet someone', description: 'Find people with similar interests and chat freely.', Icon: Users, tone: 'blue' },
  { id: 'help', title: 'Get quick help', description: 'Find someone who can share a tip or practice with you.', Icon: HeartHandshake, tone: 'green' },
  { id: 'teach', title: 'Share or swap', description: 'Offer a skill, trade tips, or discover something together.', Icon: ArrowLeftRight, tone: 'amber' },
];

// Activities are invitations within casual chat, never prerequisites for leaving.
export const ACTIVITIES = [
  { id: 'explore', title: 'Explore together', description: 'Discover something new through conversation.', Icon: Compass },
  { id: 'share', title: 'Share a skill', description: 'Show someone a trick, tip, or technique.', Icon: Lightbulb },
  { id: 'ask', title: 'Ask for help', description: 'Get a little help without booking a lesson.', Icon: BookOpen },
  { id: 'challenge', title: 'Try a challenge', description: 'Choose a small, fun activity to attempt together.', Icon: Trophy },
];

export const ACTIVITY_PROMPTS = {
  explore: ['Share an interesting fact or hobby', 'Ask each other a question', 'Try a new idea together'],
  share: ['Share one useful tip', 'Let your partner try or ask questions', 'Discuss what worked'],
  ask: ['Explain what you need help with', 'Try one suggestion', 'Ask follow-up questions'],
  challenge: ['Pick a tiny challenge', 'Give it a try', 'Share what happened'],
};

// Fictional, approved demo profiles. These are never fetched from strangers online.
export const PEOPLE = [
  { id: 'ava', name: 'Ava', initials: 'AV', categories: ['Languages', 'Music'], expertise: ['Spanish', 'English'], learning: ['Guitar'], rating: 4.9, sessions: 35, helped: 27, hue: 'rose', intro: "Hi! I enjoy languages and music. What have you been into lately?", lesson: 'Learn five useful Spanish phrases', steps: ['Learn a greeting', 'Ask a simple question', 'Practice a polite response'], languages: 'Spanish / English' },
  { id: 'leo', name: 'Leo', initials: 'LE', categories: ['Music', 'Design'], expertise: ['Guitar', 'Music production'], learning: ['Japanese'], rating: 4.8, sessions: 51, helped: 39, hue: 'amber', intro: "Hey! I'm into guitar and making music. What have you been listening to?", lesson: 'Practice three beginner guitar chords', steps: ['Try your first chord', 'Practice changing chords', 'Play a short progression'], languages: 'English' },
  { id: 'sam', name: 'Sam', initials: 'SA', categories: ['Gaming', 'Programming'], expertise: ['Minecraft', 'Strategy games'], learning: ['Web design'], rating: 4.7, sessions: 20, helped: 15, hue: 'sky', intro: 'Hey! Nice to meet you. What games are you into?', lesson: 'Try one new Minecraft building technique', steps: ['Pick a small build', 'Try a new technique', 'Review the result'], languages: 'English' },
  { id: 'mina', name: 'Mina', initials: 'MI', categories: ['Languages', 'Design'], expertise: ['Japanese', 'Illustration'], learning: ['Piano'], rating: 4.9, sessions: 30, helped: 24, hue: 'violet', intro: 'Hello! We could practice Japanese or talk about illustration.', lesson: 'Practice a short Japanese introduction', steps: ['Say hello', 'Introduce yourself', 'Ask a follow-up question'], languages: 'Japanese / English' },
  { id: 'jules', name: 'Jules', initials: 'JU', categories: ['Design', 'Other'], expertise: ['Digital art', 'Photography'], learning: ['Python'], rating: 4.8, sessions: 18, helped: 14, hue: 'teal', intro: 'Hi! Do you want to talk about art, design or something totally new?', lesson: 'Learn one composition technique', steps: ['Choose a subject', 'Try a composition tip', 'Review your artwork'], languages: 'English' },
  { id: 'ari', name: 'Ari', initials: 'AR', categories: ['Programming', 'Other'], expertise: ['Python', 'React'], learning: ['French'], rating: 5.0, sessions: 22, helped: 16, hue: 'mint', intro: 'Hey! I enjoy helping with beginner coding questions.', lesson: 'Understand a simple Python function', steps: ['Explain the purpose', 'Read a short example', 'Write a tiny function'], languages: 'English' },
];

export const EMPTY_PROGRESS = {
  sessionsCompleted: 0,
  taughtSessions: 0,
  peopleHelped: [],
  learnedCategories: [],
  ratedSessions: [],
  recentActivities: [],
};
export const KEY = 'skill-roulette-light-demo-v1';
export function readDemo() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    return {
      progress: { ...EMPTY_PROGRESS, ...(raw.progress || {}) },
      blocked: Array.isArray(raw.blocked) ? raw.blocked : [],
    };
  } catch {
    return { progress: { ...EMPTY_PROGRESS }, blocked: [] };
  }
}

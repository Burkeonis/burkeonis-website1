import { AbyssTopic, Session, UserProfile } from './types';

export const INITIAL_ABYSS_TOPICS: AbyssTopic[] = [
  {
    id: 'fear',
    title: 'FEAR',
    subtitle: 'What are you avoiding?',
    description: 'Explore the hidden threats you are constantly anticipating, and what your defenses are actively preventing you from seeing.',
    iconName: 'ShieldAlert',
    initialQuestion: 'What is the absolute worst thing that would happen if you stopped blaming your current situation, and what would you have to admit about yourself?'
  },
  {
    id: 'relationships',
    title: 'RELATIONSHIPS',
    subtitle: 'How do you show up?',
    description: 'Deconstruct the silent contracts, unmet expectations, and defense mechanisms you bring to your connection with others.',
    iconName: 'Link2',
    initialQuestion: 'Are you asking to be deeply understood by the people in your life while actively refusing to understand them or let them see your vulnerability?'
  },
  {
    id: 'identity',
    title: 'IDENTITY',
    subtitle: 'Who are you without your masks?',
    description: 'Shed the professional titles, social roles, and curated traits to see which parts of you are real and which are protective armor.',
    iconName: 'UserCheck',
    initialQuestion: 'Think of your strongest personality trait. What part of that trait exists solely because it once protected you in an environment you have already left?'
  },
  {
    id: 'ambition',
    title: 'AMBITION',
    subtitle: 'Do you want the work, or the image?',
    description: 'Challenge the gap between your stated goals and the sacrifices you are willing to make to see if you desire achievement or just recognition.',
    iconName: 'Flame',
    initialQuestion: 'Look at your primary goal. Do you genuinely desire the hard, monotonous daily work required, or do you just desire the identity and admiration of someone who achieves it?'
  },
  {
    id: 'shadow',
    title: 'SHADOW PATTERNS',
    subtitle: 'Your repeated cycles and defenses.',
    description: 'Observe the self-sabotaging routines you perform on repeat and learn to separate the wound from the weapon.',
    iconName: 'Layers',
    initialQuestion: 'Think of the last time you got angry or isolated yourself. Were you genuinely protecting your boundaries (wound), or were you using it to control the situation (weapon)?'
  }
];

export const INITIAL_USER_PROFILE: UserProfile = {
  name: '',
  repeatingTriggersCount: 0,
  emotionalReactionsCount: 0,
  corePatternsCount: 0,
  breakthroughsCount: 0,
  recentTriggers: [],
  shadowSwaps: [],
  isMemoryEnabled: true
};

export const INITIAL_SESSIONS: Session[] = [];


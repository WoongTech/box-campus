export type Week = {
  id: string;
  number: number;
  title: string;
  promise: string;
  ideaIds: string[];
};

export type Idea = {
  id: string;
  title: string;
  weekId: string;
};

export type Campus = {
  id: string;
  title: string;
  origin: "authored-sample" | "advisor-template";
  weeks: Week[];
  ideas: Idea[];
  cards: Array<{ id: string; role: string; ideaId: string }>;
};

export type WeekInput = {
  id: string;
  number: number;
  title: string;
  promise: string;
  ideaIds: string[];
};

export type IdeaInput = {
  id: string;
  title: string;
  weekId: string;
};

export type CardInput = {
  role: string;
  id: string;
  ideaId: string;
  provenance?: string;
  thesis?: string;
  source?: { label: string; href?: string | null };
  question?: string;
  choices?: Array<string | { label: string; isCorrect?: boolean }>;
  correctIndex?: number;
  reveal?: string;
  holeLabel?: string;
  patches?: Array<string | { label: string; closesHole?: boolean; explanation?: string }>;
  argument?: string;
  foreignField?: string;
  field?: string;
  analogy?: string;
  analogyLimit?: string;
};

export type CampusInput = {
  id: string;
  title: string;
  origin?: "authored-sample" | "advisor-template";
  weeks: WeekInput[];
  ideas: IdeaInput[];
  cards: CardInput[];
  loop?: unknown;
};

export type FeedBookmark = {
  current: { role: string; phase: string; cardId?: string };
  slotIndex: number;
  ideaId: string;
  completedCardIds: string[];
  recentIdeaIds: string[];
  hub: boolean;
  dayClose?: boolean;
  dayCloseDate?: string;
  resumeFeed?: FeedBookmark;
  tutorSecondLook?: string | null;
  bridgeHint?: string | null;
};

export type Session =
  | { kind: "feed"; feed: FeedBookmark }
  | { kind: "advisor"; stage: string; answers: Record<string, unknown>; returnTo: FeedBookmark }
  | { kind: "strip"; selectedWeek: number; returnTo: FeedBookmark };

export type PlayerState = {
  schema: 1;
  campus: Campus;
  session: Session;
  progress: {
    tutorMemory: Record<string, unknown>;
    dayPulse: { date: string; completed: number };
    wrongTutor: { cardId: string; cardsSinceWrong: number } | null;
    dailyGoal: number;
  };
  transitionId: string;
  notice: string | null;
  authorBrief: string | null;
};

export type Block =
  | { kind: "eyebrow" | "title" | "body" | "badge"; text: string }
  | { kind: "source"; text: string; href?: string | null }
  | { kind: "verdict"; tone: "good" | "retry"; text: string };

export type Control =
  | { kind: "advance"; label: string }
  | { kind: "choices"; options: { actionId: string; label: string }[] }
  | {
      kind: "text";
      actionId: string;
      label: string;
      placeholder: string;
      maxLength: number;
    };

export type CardView = {
  role: string;
  letter: string;
  roleLabel: string;
  weekLabel: string | null;
  pentadIndex: number | null;
  blocks: Block[];
  control: Control;
  dayCount: number;
  authorBrief: string | null;
};

export type Frame =
  | { kind: "card"; transitionId: string; view: CardView }
  | {
      kind: "strip";
      transitionId: string;
      title: string;
      selectedWeek: number;
      weeks: Week[];
      campus: Campus;
    };

export type CampusEvent =
  | { kind: "import-campus"; raw: unknown; transitionId?: string }
  | { kind: "start-advisor" }
  | { kind: "cancel-advisor" }
  | { kind: "reset-sample"; raw: unknown }
  | { kind: "open-strip"; week?: number; transitionId?: string }
  | { kind: "close-strip"; transitionId?: string }
  | { kind: "select-week"; week: number; transitionId?: string }
  | { kind: "activate"; transitionId: string; actionId: string; raw?: unknown }
  | { kind: "advance"; transitionId: string }
  | { kind: "submit-text"; transitionId: string; actionId: string; value: string };

export type ScheduleIntent = { kind: "resume" };

export type ParseResult = {
  state: PlayerState;
  recovered: boolean;
};

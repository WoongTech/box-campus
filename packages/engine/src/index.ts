import {
  createInitialState as createInitialStateCore,
  dumpState as dumpStateCore,
  parseCampus as parseCampusCore,
  parseState as parseStateCore,
  record as recordCore,
  schedule as scheduleCore,
} from "./core";
import type {
  Campus,
  CampusEvent,
  CampusInput,
  Frame,
  ParseResult,
  PlayerState,
  ScheduleIntent,
} from "./types";

export type {
  Block,
  Campus,
  CampusEvent,
  CampusInput,
  CardView,
  Control,
  FeedBookmark,
  Frame,
  ParseResult,
  PlayerState,
  ScheduleIntent,
  Session,
  Week,
} from "./types";

export { BOX_CAMPUS_SAMPLE } from "./sample";

export function parseCampus(raw: unknown): Campus {
  return parseCampusCore(raw) as Campus;
}

export function createInitialState(rawCampus: CampusInput | unknown, now: number): PlayerState {
  return createInitialStateCore(rawCampus, now) as PlayerState;
}

export function schedule(state: PlayerState, now: number, intent: ScheduleIntent): Frame {
  return scheduleCore(state, now, intent) as Frame;
}

export function record(state: PlayerState, event: CampusEvent, now: number): PlayerState {
  return recordCore(state, event, now) as PlayerState;
}

export function dumpState(state: PlayerState): string {
  return dumpStateCore(state) as string;
}

export function parseState(
  json: string | null | undefined,
  fallbackCampus: unknown,
  now: number,
): ParseResult {
  return parseStateCore(json, fallbackCampus, now) as ParseResult;
}

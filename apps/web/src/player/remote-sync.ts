import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readShelf, type ShelfLibrary } from "./place-campus";

const SYNCED_AT = "box-campus-synced-at";
const FEED_AT = "box-campus-feed-at";
const PUSH_DELAY_MS = 600;

export type RemoteShelf = {
  session: string;
  library: string;
  updatedAt: string;
};

type PushPayload = { session: string; library: string };

let client: SupabaseClient | null | undefined;
let pushEnabled = false;
let applying = false;
let timer: number | null = null;
let pending: PushPayload | null = null;
let onStale: (() => void) | null = null;

export function remoteConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function getClient() {
  if (client) return client;
  if (typeof window === "undefined") return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  client = createClient(url, key, {
    auth: {
      detectSessionInUrl: true,
      flowType: "pkce",
      persistSession: true,
    },
  });
  return client;
}

export async function finishAuthRedirect() {
  if (typeof window === "undefined") return null;
  const hadCode = new URLSearchParams(window.location.search).has("code");
  const supabase = getClient();
  if (!supabase) return hadCode ? "계정이 아직 이 화면에 붙지 않았습니다." : null;
  const { data } = await supabase.auth.getSession();
  if (data.session || !hadCode) return null;
  return "이 브라우저에서 보낸 링크가 아닙니다. 여기서 다시 보내 주세요.";
}

export type RemoteUser = { id: string; email: string | null };

export function subscribeAuth(onUser: (user: RemoteUser | null) => void) {
  const supabase = getClient();
  if (!supabase) {
    onUser(null);
    return () => {};
  }
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    const user = session?.user;
    onUser(user ? { id: user.id, email: user.email ?? null } : null);
  });
  return () => data.subscription.unsubscribe();
}

export async function sendSignInLink(email: string) {
  const supabase = getClient();
  if (!supabase) return { error: "계정을 아직 붙이지 않았습니다." };
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  });
  return { error: error?.message ?? null };
}

export async function signOutRemote() {
  const supabase = getClient();
  if (!supabase) return;
  pushEnabled = false;
  await supabase.auth.signOut();
}

export async function currentEmail() {
  const supabase = getClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.email ?? null;
}

export function bindRemoteStale(handler: () => void) {
  onStale = handler;
}

export function markRemoteReady() {
  pushEnabled = true;
}

export function beginRemoteApply() {
  applying = true;
}

export function endRemoteApply() {
  applying = false;
  pushEnabled = true;
}

const REMOTE_USER = "box-campus-remote-user";

export type ShelfLookup = { shelf: RemoteShelf | null } | { error: true };

export async function fetchShelf(): Promise<ShelfLookup> {
  const supabase = getClient();
  if (!supabase) return { shelf: null };
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { shelf: null };
  const { data, error } = await supabase
    .from("learner_shelves")
    .select("session, library, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return { error: true };
  if (!data) return { shelf: null };
  return {
    shelf: {
      session: String(data.session),
      library: typeof data.library === "string" ? data.library : JSON.stringify(data.library),
      updatedAt: String(data.updated_at),
    },
  };
}

export function localRemoteUser() {
  return window.localStorage.getItem(REMOTE_USER) ?? "";
}

export function rememberRemoteUser(userId: string) {
  window.localStorage.setItem(REMOTE_USER, userId);
}

export function localSyncedAt() {
  return window.localStorage.getItem(SYNCED_AT) ?? "";
}

export function rememberSyncedAt(updatedAt: string) {
  window.localStorage.setItem(SYNCED_AT, updatedAt);
}

export function localFeedAt() {
  return window.localStorage.getItem(FEED_AT) ?? "";
}

export function rememberFeedAt(updatedAt: string) {
  window.localStorage.setItem(FEED_AT, updatedAt);
}

export async function fetchSharedShelf(): Promise<
  { library: ShelfLibrary; updatedAt: string } | { error: true }
> {
  try {
    const load = globalThis["fetch"].bind(globalThis);
    const response = await load("/api/feed", { cache: "no-store" });
    if (!response.ok) return { error: true };
    const body = (await response.json()) as { library?: unknown; updatedAt?: string };
    return { library: readShelf(body.library), updatedAt: String(body.updatedAt ?? "") };
  } catch {
    return { error: true };
  }
}

export function schedulePush(session: string, library: string) {
  if (!pushEnabled || applying || !remoteConfigured()) return;
  pending = { session, library };
  if (timer !== null) window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    timer = null;
    void flushPush();
  }, PUSH_DELAY_MS);
}

async function flushPush() {
  const next = pending;
  pending = null;
  if (!next) return;
  const result = await pushShelf(next.session, next.library);
  if (result === "stale") onStale?.();
}

async function pushShelf(session: string, libraryText: string) {
  const supabase = getClient();
  if (!supabase) return "signed-out" as const;
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return "signed-out" as const;

  const { data: existing } = await supabase
    .from("learner_shelves")
    .select("updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  const remoteAt = existing?.updated_at ? String(existing.updated_at) : "";
  if (remoteAt && isRemoteNewer(remoteAt, localSyncedAt())) return "stale" as const;

  let library: unknown;
  try {
    library = JSON.parse(libraryText) as unknown;
  } catch {
    return "error" as const;
  }
  const updatedAt = new Date().toISOString();
  const { error } = await supabase.from("learner_shelves").upsert({
    user_id: userId,
    session,
    library,
    updated_at: updatedAt,
  });
  if (error) return "error" as const;
  rememberSyncedAt(updatedAt);
  return "ok" as const;
}

export function isRemoteNewer(remoteAt: string, localAt: string) {
  const remote = Date.parse(remoteAt);
  const local = Date.parse(localAt);
  if (Number.isNaN(remote)) return false;
  if (Number.isNaN(local)) return true;
  return remote > local;
}

export async function issueAgentKey() {
  const supabase = getClient();
  if (!supabase) return { error: "계정을 아직 붙이지 않았습니다." };
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { error: "먼저 로그인하세요." };
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const token = `box_${[...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  const tokenHash = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  const { error } = await supabase.from("agent_keys").upsert({
    user_id: userId,
    token_hash: tokenHash,
  });
  if (error) return { error: "키를 저장하지 못했습니다." };
  return { token };
}

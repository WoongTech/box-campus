import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { describeShelf, placeCampus, readShelf } from "@/player/place-campus";

export const dynamic = "force-dynamic";

function serviceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const PERSONAL_BEARER = "tech-shin";
const PERSONAL_USER_ID = "21dc71f9-9660-4525-8d1b-5b1a3cac0ff9";

function bearer(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return "";
  return header.slice("Bearer ".length).trim();
}

async function hashToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function userIdForToken(supabase: SupabaseClient, token: string) {
  if (!token) return null;
  if (token === PERSONAL_BEARER) return PERSONAL_USER_ID;
  const tokenHash = await hashToken(token);
  const { data, error } = await supabase
    .from("agent_keys")
    .select("user_id")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (error || !data?.user_id) return null;
  return String(data.user_id);
}

function unwrapPack(body: unknown) {
  if (body && typeof body === "object" && "BOX_CAMPUS_PACK" in body) {
    return (body as { BOX_CAMPUS_PACK: unknown }).BOX_CAMPUS_PACK;
  }
  return body;
}

export async function GET(request: Request) {
  const supabase = serviceClient();
  if (!supabase) {
    return Response.json({ error: "계정이 아직 서버에 연결되지 않았습니다." }, { status: 503 });
  }
  const userId = await userIdForToken(supabase, bearer(request));
  if (!userId) return Response.json({ error: "키를 확인하지 못했습니다." }, { status: 401 });

  const { data, error } = await supabase
    .from("learner_shelves")
    .select("session, library")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return Response.json({ error: "스토리를 읽지 못했습니다." }, { status: 500 });

  const library = readShelf(data?.library ?? null);
  const sessionText = data?.session ? String(data.session) : null;
  const requested = new URL(request.url).searchParams.get("id") ?? undefined;
  return Response.json(describeShelf(sessionText, library, requested));
}

export async function POST(request: Request) {
  const supabase = serviceClient();
  if (!supabase) {
    return Response.json({ error: "계정이 아직 서버에 연결되지 않았습니다." }, { status: 503 });
  }
  const userId = await userIdForToken(supabase, bearer(request));
  if (!userId) return Response.json({ error: "키를 확인하지 못했습니다." }, { status: 401 });

  let body: unknown;
  try {
    body = unwrapPack(await request.json());
  } catch {
    return Response.json({ error: "JSON 객체가 아닙니다." }, { status: 400 });
  }

  const { data: existing, error: readError } = await supabase
    .from("learner_shelves")
    .select("session, library")
    .eq("user_id", userId)
    .maybeSingle();
  if (readError) return Response.json({ error: "스토리를 읽지 못했습니다." }, { status: 500 });

  let placed: ReturnType<typeof placeCampus>;
  try {
    placed = placeCampus({
      sessionText: existing?.session ? String(existing.session) : null,
      library: readShelf(existing?.library ?? null),
      raw: body,
      now: Date.now(),
    });
  } catch (error) {
  const message = typeof error === "string" ? error : error instanceof Error ? error.message : "묶음을 읽지 못했습니다.";
    return Response.json({ error: message }, { status: 400 });
  }

  const updatedAt = new Date().toISOString();
  const { error: writeError } = await supabase.from("learner_shelves").upsert({
    user_id: userId,
    session: placed.sessionText,
    library: placed.library,
    updated_at: updatedAt,
  });
  if (writeError) return Response.json({ error: "스토리를 저장하지 못했습니다." }, { status: 500 });

  return Response.json({ id: placed.id, title: placed.title });
}

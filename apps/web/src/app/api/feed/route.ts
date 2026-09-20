import { createClient } from "@supabase/supabase-js";
import { absorbShelf, emptyShelf, readShelf } from "@/player/place-campus";

export const dynamic = "force-dynamic";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET() {
  const supabase = serviceClient();
  if (!supabase) {
    return Response.json({ error: "계정이 아직 서버에 연결되지 않았습니다." }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("learner_shelves")
    .select("library, updated_at")
    .order("updated_at", { ascending: true });
  if (error) return Response.json({ error: "스토리를 읽지 못했습니다." }, { status: 500 });

  let library = emptyShelf();
  let updatedAt = "";
  for (const row of data ?? []) {
    library = absorbShelf(library, readShelf(row.library), Date.now());
    const at = row.updated_at ? String(row.updated_at) : "";
    if (at > updatedAt) updatedAt = at;
  }

  return Response.json({ library, updatedAt });
}

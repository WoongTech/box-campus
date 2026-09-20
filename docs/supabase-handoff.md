# Supabase 연결

이 세션의 일은 계정 저장소를 붙이는 것까지다. 화면 파일은 고치지 않는다.

저장소는 `/Users/tree/Dev/box-campus`다. `/Users/tree/Dev/cia-study`는 열지 않는다. 커밋과 푸시는 하지 않는다. git config는 바꾸지 않는다. 키 값을 채팅, 코드, `NEXT_PUBLIC_` 변수에 넣지 않는다. `SUPABASE_SERVICE_ROLE_KEY`는 `apps/web/.env.local`에만 둔다. 그 파일은 이미 gitignore다.

## 이미 있는 것

- `supabase/learner_shelves.sql` — `learner_shelves`, `agent_keys`. RLS는 `auth.uid() = user_id`.
- `apps/web/src/app/api/agent/campus/route.ts` — `POST`/`GET`. 서버는 `NEXT_PUBLIC_SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY`로 서비스 클라이언트를 만든다. Bearer 키는 `agent_keys.token_hash`(SHA-256)로 사용자를 찾는다.
- `apps/web/src/player/remote-sync.ts` — 브라우저 동기화. `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_ANON_KEY`가 없으면 이 브라우저만 쓴다.
- `apps/web/.env.example` — 변수 이름 세 개. 값은 비어 있다.

## 순서

1. `GetDynamicTools`로 `supabase`를 찾는다. 스키마를 읽은 뒤 `CallDynamicTool`로 호출한다. 네임스페이스가 `needsAuth`면 그 네임스페이스의 `mcp_auth`를 빈 인자로 호출하고 다시 목록을 본다.
2. MCP가 없으면 Cursor에 `https://mcp.supabase.com/mcp`를 추가하고 OAuth를 끝낸 뒤 세션을 새로고침한다. 플러그인 설치 도구가 있으면 Supabase 플러그인을 설치한 뒤 같은 인증을 한다. 서버가 없으면 여기서 멈추고, 한 일 없이 그 사실만 알린다.
3. 프로젝트 목록을 본다. 이름이 box-campus 또는 easy-box인 것이 있으면 그걸 쓴다. 프로젝트가 하나뿐이면 그걸 쓴다. 여럿이고 이름이 맞지 않으면 목록만 알리고 고르지 않는다.
4. `supabase/learner_shelves.sql`을 그 프로젝트에 실행한다. 다른 테이블은 지우지 않는다.
5. URL, anon key, service role key를 MCP로 읽는다. `apps/web/.env.local`에 아래 이름만 채운다.

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

6. Auth 리다이렉트에 `http://127.0.0.1:8792`와 `http://localhost:8792`를 넣는다. 배포 주소를 MCP나 Vercel에서 확인했을 때만 그 origin도 넣는다. 확인하지 못하면 사용자에게 그 주소만 추가하라고 알린다.
7. `pnpm --filter @box-campus/web exec tsc --noEmit`가 통과한다. 8792에 서버가 있으면 키 없는 `POST /api/agent/campus`가 401인지 본다. 503이면 서비스 롤이 서버 프로세스에 안 읽힌 것이다. 개발 서버를 새로 띄우기 전에 기존 8792 프로세스를 확인한다.

## 끝난 상태

- SQL이 적용되어 있다.
- `.env.local`에 이름 세 개가 있고, 값은 채팅에 없다.
- 키 없는 POST는 401이다. 키가 맞으면 `{ "id", "title" }`이다.
- 화면 코드 diff는 없다.

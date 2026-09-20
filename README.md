# 상자

주제 하나가 계정이다. 한 화면이 한 장이고, 위로 밀면 다음 장이다.

```
apps/web          Next.js 플레이어
packages/engine   일정과 기록. 화면을 모른다
```

개발 서버는 저장소 루트에서 `pnpm dev`. 검증은 `pnpm test`.

카드 내용은 API로 만들지 않는다. Cursor나 Grok 채팅으로 묶음을 만든 뒤 화면의 주제 추가에 붙인다. 작성법은 `AUTHOR.md`에 있다.

Vercel 프로젝트는 `easy-box`다. 루트 디렉터리는 `apps/web`이고, 출력 디렉터리는 그 안의 `.next`다.

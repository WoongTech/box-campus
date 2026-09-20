# 묶음 작성

용어: **스토리**는 주제 묶음(캠퍼스 팩)이다. **아이디어**는 카드뉴스 한 편(네 장 슬라이드)이다. **카드**는 슬라이드 한 장이다. 확인한 사진은 슬라이드의 `image: { src, alt }`(https만)이다.

학습자에게 역할 이름을 보여 주지 않는다. 슬라이드 문장에도 조언자, 사서, 튜터, 에디터, 룸메이트를 쓰지 않는다.

카드뉴스 한 편은 ALTER 박자 그대로다. 핵심 한 장 → 질문 한 개 → 구멍 하나 → 다른 분야 비유 한 개. 하루 분량·멈춤은 없다. 학습자는 네 장 리듬으로만 넘긴다.

조언자는 카드가 아니다. 플레이어의 네 결정(주제 → 끝 목표 → 출발점 → 비유 분야)이다.

아래 프롬프트는 Cursor 또는 Grok 채팅에 붙여 넣는 용도다. API 키는 필요 없다. 채팅이 만든 묶음을 화면의 넣기에 붙여 넣으면 된다.

## 플레이어에 붙이기

1. 채팅이 만든 `campuses/<slug>.js` 내용을 복사합니다.
2. 화면의 **넣기**에 붙여 넣고 **묶음 붙이기**를 누른다.

## 묶음 스키마 (요약)

전역 `BOX_CAMPUS_PACK` 또는 JSON 객체 하나. `BoxCampus.parseCampus`가 검증합니다.

```js
var BOX_CAMPUS_PACK = {
  id: "고유-id",
  title: "주제 제목",
  origin: "authored-sample", // 또는 advisor-template
  format: "course", // course | volume | series
  weeks: [
    // course는 정확히 6개. volume은 1개. series는 1개 이상.
    { id: "w1", number: 1, title: "…", promise: "…", ideaIds: ["i1"] },
    // course의 2–6주는 ideaIds: [] 가능
  ],
  ideas: [{ id: "i1", title: "…", weekId: "w1" }],
  cards: [
    {
      role: "librarian",
      id: "…",
      ideaId: "i1",
      thesis: "…",
      source: { label: "출처 한 줄", href: null },
      // 선택. 확인한 https만. 주소를 지어내지 말 것
      image: { src: "https://…", alt: "화면에 보일 설명" },
      provenance: "authored",
    },
    {
      role: "tutor",
      id: "…",
      ideaId: "i1",
      question: "…",
      choices: ["…", "…"],
      correctIndex: 0,
      reveal: "…",
      provenance: "authored",
    },
    {
      role: "editor",
      id: "…",
      ideaId: "i1",
      thesis: "…",
      holeLabel: "…",
      patches: ["…", "…"],
      correctIndex: 0,
      reveal: "…",
      provenance: "authored",
    },
    {
      role: "roommate",
      id: "…",
      ideaId: "i1",
      foreignField: "…",
      analogy: "…",
      analogyLimit: "…",
      image: { src: "https://…", alt: "비유를 돕는 장면" },
      provenance: "authored",
    },
  ],
};
```

`image`는 모든 슬라이드에 선택이다. 이어보기 화면에서는 사진이 크게 보이고 글은 그 아래 캡션처럼 붙는다. 핵심 슬라이드·비유 슬라이드에 두는 것이 가장 자연스럽다.

## 채팅에 붙여 넣는 프롬프트

```
당신은 box-campus 학습 묶음 작성자입니다. 네트워크나 API는 쓰지 마세요.

주제: <여기에 주제>

다음 규칙으로 campuses/<slug>.js 파일 내용만 출력하세요.
- var BOX_CAMPUS_PACK = { ... }; 형태
- 한국어 UI 문장
- format은 course, volume, series. 팟캐스트 정리처럼 6주가 아니면 volume(단행본) 또는 series(시리즈)
- course만 주차 6개. volume은 weeks 1개. series는 편 수만큼, 제목은 주차 이름이 아님
- 각 아이디어에 librarian → tutor → editor → roommate 네 장 (읽는 순서 고정)
- 확인한 사진만 image: { src: "https://...", alt: "설명" }. 주소를 만들지 말 것
- 하루 분량·멈춤 필드는 넣지 말 것
- 사실을 지어내지 말고, 출처 label은 실제로 확인 가능한 범위에서만
- 튜터 선택지 2개 이상, 정답 하나
- 에디터 패치 2개 이상, 구멍을 닫는 패치 하나
- AUTHOR.md 스키마와 sample-campus.js와 같은 필드 이름

코드 블록 하나만 출력하세요.
```

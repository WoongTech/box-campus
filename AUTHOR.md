# 묶음 작성

학습자에게 역할 이름을 보여 주지 않는다. 카드 문장에도 조언자, 사서, 튜터, 에디터, 룸메이트를 쓰지 않는다.

묶음의 박자는 정해져 있다. 아이디어 하나마다 핵심 한 장, 질문 한 개, 구멍 하나, 다른 분야의 비유 한 개다. 여섯 주는 다섯 번의 결정 뒤에 온다. 이 이름은 작성자만 안다.

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
  weeks: [
    // 정확히 6개, number 1..6
    { id: "w1", number: 1, title: "…", promise: "…", ideaIds: ["i1"] },
    // 2–6주는 ideaIds: [] 가능
  ],
  ideas: [{ id: "i1", title: "…", weekId: "w1" }],
  cards: [
    {
      role: "librarian",
      id: "…",
      ideaId: "i1",
      thesis: "…",
      source: { label: "출처 한 줄", href: null },
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
      id: "i1",
      ideaId: "i1",
      foreignField: "…",
      analogy: "…",
      analogyLimit: "…",
      provenance: "authored",
    },
  ],
};
```

아이디어 하나마다 사서, 튜터, 에디터, 룸메이트 네 장이다. 조언자는 카드가 아니다. 조언자는 플레이어의 다섯 결정이다.

## 채팅에 붙여 넣는 프롬프트

```
당신은 box-campus 학습 묶음 작성자입니다. 네트워크나 API는 쓰지 마세요.

주제: <여기에 주제>

다음 규칙으로 campuses/<slug>.js 파일 내용만 출력하세요.
- var BOX_CAMPUS_PACK = { ... }; 형태
- 한국어 UI 문장
- 주차 6개 (1주차에만 아이디어·카드, 2–6주는 제목·약속만 ideaIds: [])
- 각 아이디어에 librarian → tutor → editor → roommate 네 역할 카드
- 사실을 지어내지 말고, 출처 label은 실제로 확인 가능한 범위에서만
- 튜터 선택지 2개 이상, 정답 하나
- 에디터 패치 2개 이상, 구멍을 닫는 패치 하나
- AUTHOR.md 스키마와 sample-campus.js와 같은 필드 이름

코드 블록 하나만 출력하세요.
```

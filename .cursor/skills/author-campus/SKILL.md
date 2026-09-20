---
name: author-campus
description: Writes an ALTER reel pack for a topic. ALTER is Advisor, Librarian, Tutor, Editor, and Roommate. Use when the user wants a 6-week reel, a campus pack, or cards for a new topic.
---

# author-campus

box-campus 플레이어용 캠퍼스 묶음을 만듭니다. 플레이어는 `parseCampus`만 호출하며 LLM API를 쓰지 않습니다.

## 할 일

1. 사용자 주제·목표·분량을 묻거나 브리프에서 읽습니다.
2. `campuses/<slug>.js`를 작성합니다. 파일은 `var BOX_CAMPUS_PACK = { ... };` 한 개만 반환합니다.
3. `AUTHOR.md`와 `packages/engine/src/sample.ts`의 필드·역할 이름을 따릅니다.
4. 주차는 6개. 1주차에 아이디어와 카드, 2–6주는 `ideaIds: []`만 허용합니다.
5. 각 아이디어는 사서, 튜터, 에디터, 룸메이트 네 장이다. 조언자 카드는 넣지 않는다. 조언자는 플레이어의 다섯 결정이다.
6. 문장은 한국어입니다. 인용·출처를 지어내지 않습니다. `source.label`은 검증 가능한 설명만 씁니다.
7. 완성 후 사용자에게 플레이어 **묶음 붙이기**에 넣도록 안내합니다.

## 카드 규칙

- **사서**: `thesis`, `source: { label, href }`
- **튜터**: `question`, `choices[]`, `correctIndex`, `reveal`
- **에디터**: `thesis`, `holeLabel`, `patches[]`, `correctIndex`, `reveal`
- **룸메이트**: `foreignField`, `analogy`, `analogyLimit`

`provenance: "authored"` unless the user explicitly asked for a draft scaffold.

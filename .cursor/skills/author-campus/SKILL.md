---
name: author-campus
description: Writes an ALTER reel pack for a topic. ALTER is Advisor, Librarian, Tutor, Editor, and Roommate. Use when the user wants a 6-week reel, a campus pack, or cards for a new topic.
---

# author-campus

box-campus 플레이어용 **스토리**(주제 묶음)를 만듭니다. 플레이어는 `parseCampus`만 호출하며 LLM API를 쓰지 않습니다.

용어: 스토리=주제 묶음, 아이디어=카드뉴스 한 편(네 슬라이드), 카드=슬라이드 한 장, 사진=슬라이드 `image`.

## 할 일

1. 사용자 주제·목표·분량을 묻거나 브리프에서 읽습니다.
2. `campuses/<slug>.js`를 작성합니다. 파일은 `var BOX_CAMPUS_PACK = { ... };` 한 개만 반환합니다.
3. `AUTHOR.md`와 `packages/engine/src/sample.ts`의 필드·역할 이름을 따릅니다.
4. `format`은 `course`, `volume`, `series`입니다. 없으면 6주 `course`입니다. `volume`은 부분 1개, `series`는 1개 이상의 편입니다.
5. 각 아이디어(카드뉴스 한 편)는 사서 → 튜터 → 에디터 → 룸메이트 네 슬라이드다. 읽는 순서는 고정이다. 조언자 슬라이드는 넣지 않는다. 조언자는 플레이어의 네 결정이다.
6. 하루 분량·멈춤 필드는 넣지 않는다. 학습자는 네 장 리듬으로만 넘긴다.
7. 사진은 기본으로 넣지 않는다. 핵심 슬라이드에만, 문장이 가리키는 도식·표·원문 캡처를 `image: { src, alt }`로 넣는다. 질문·비유 슬라이드와 장식용 스톡·발표 제목·YouTube/강의 표지 썸네일·무관한 스크린샷은 넣지 않는다. 주소를 지어내지 않는다.
8. 문장은 한국어입니다. 인용·출처를 지어내지 않습니다. `source.label`은 검증 가능한 설명만 씁니다.
9. 완성 후 사용자에게 플레이어 **묶음 붙이기**에 넣도록 안내합니다.

## 카드 규칙

- **사서**: `thesis`, `source: { label, href }`, 드물게 `image`(문장이 가리키는 도식만)
- **튜터**: `question`, `choices[]`, `correctIndex`, `reveal`
- **에디터**: `thesis`, `holeLabel`, `patches[]`, `correctIndex`, `reveal`
- **룸메이트**: `foreignField`, `analogy`, `analogyLimit`

`provenance: "authored"` unless the user explicitly asked for a draft scaffold.

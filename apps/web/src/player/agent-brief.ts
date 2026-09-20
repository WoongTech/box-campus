const FIELD_RULES = `필수 모양:
- id, title
- weeks 정확히 6개. number는 1부터 6까지 순서. 각 주는 id, title, promise, ideaIds
- 1주차 ideaIds는 비우지 않음. 나머지 주는 비어도 됨
- ideas: { id, title, weekId }. weekId는 weeks의 id
- cards: 아이디어마다 네 장. role은 librarian, tutor, editor, roommate 중 하나
- librarian: thesis, source.label
- tutor: question, choices 2개 이상, correctIndex 하나, reveal
- editor: thesis, holeLabel, patches 2개 이상, 그중 정답 correctIndex 하나, reveal
- roommate: foreignField, analogy, analogyLimit
- 카드 id는 모두 달라야 함

학습자에게 보일 문장에는 librarian, tutor, editor, roommate, 사서, 튜터, 에디터, 룸메이트라는 말을 쓰지 마세요. 확인하지 못한 사실은 만들지 마세요.`;

export function agentInstructions(origin: string) {
  const endpoint = `${origin}/api/agent/campus`;
  return `당신은 학습 스토리를 만드는 편집자입니다. 저장소나 앱 코드는 보지 않아도 됩니다.

넣을 수 있으면 이 주소로 JSON을 그대로 보내세요.
POST ${endpoint}
Authorization: Bearer <사용자가 준 키>
본문은 주제 JSON 객체 하나입니다. 코드 펜스를 붙이지 마세요.
먼저 GET ${endpoint} 로 지금 스토리를 읽고, 같은 id로 고치거나 새 id로 추가하세요.
성공하면 채팅에는 넣은 주제 이름만 답하세요.

네트워크를 쓸 수 없으면 JSON 객체만 출력하세요. 설명 문장은 붙이지 마세요.

${FIELD_RULES}`;
}

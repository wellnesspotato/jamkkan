export const CHECKIN_COPY = {
  roomName: '감자의 방',
  title: '잠깐 체크인',
  introDescriptionLines: ['수행을 시작하기 전,', '지금의 나를 한번 바라봅니다.'],
  start: '시작하기',
  next: '다음',
  previous: '이전',
  customOption: '직접 입력',
  customInputLabel: '직접 느껴지는 상태 입력',
  customInputPlaceholder: '지금 느껴지는 것을 적어주세요',
  bodyQuestion: '지금 몸에서 가장 먼저 느껴지는 것은?',
  bodyDescription: '잠시 몸의 느낌을 느껴보세요. 여러 개 골라도 좋아요.',
  mindQuestion: '지금 마음에서 가장 먼저 느껴지는 것은?',
  mindDescription: '어떤 감정과 생각도 좋아요. 여러 개 골라도 좋아요.',
  intentionLabel: '오늘의 수행 방향',
  statusLabel: '수행하기 전의 나',
  tipsLabel: '이렇게 머물러볼 수 있어요.',
  intentionQuestion: '오늘은 어떻게 머물고 싶나요?',
  intentionDescription: '오늘 수행의 의도를 하나만 골라보세요.',
  bodyLabel: '몸',
  mindLabel: '마음',
  resultTitle: '지금의 나',
  save: '저장하기',
  captureGuidanceLines: [
    '이 기록은 화면을 나가면 사라져요.',
    '남겨두고 싶다면 캡처해보세요.',
  ],
  completionTitle: '체크인을 마쳤어요',
  completionFirstLine: '지금의 나를 잠깐 바라봤어요.',
  completionDescriptionLines: [
    '이제 휴대폰을 내려놓고,',
    '각자의 방식으로 머물러보세요.',
  ],
} as const

export const BODY_OPTIONS = [
  '가벼움',
  '피로',
  '긴장',
  '편안함',
  '활력',
  '잘 모르겠음',
] as const

export const MIND_OPTIONS = [
  '고요함',
  '복잡함',
  '들뜸',
  '무거움',
  '편안함',
  '잘 모르겠음',
] as const

export const INTENTION_OPTIONS = [
  '움직이고 싶어요',
  '쉬고 싶어요',
  '가만히 있고 싶어요',
  '집중하고 싶어요',
  '천천히 머물고 싶어요',
  '그냥 있어보고 싶어요',
  '잘 모르겠어요',
] as const

export const INTENTION_TIPS: Record<string, readonly string[]> = {
  '움직이고 싶어요': [
    '몸이 가는 방향으로 가볍게 움직여보세요.',
    '움직임 사이에서 느껴지는 감각을 살펴보세요.',
    '지금 필요한 만큼만 움직여도 좋아요.',
  ],
  '쉬고 싶어요': [
    '숨과 몸의 힘을 조금 느슨하게 풀어보세요.',
    '잠깐 멈춰 있는 감각을 느껴보세요.',
    '쉬어가는 속도를 몸에 물어보세요.',
  ],
  '가만히 있고 싶어요': [
    '지금 있는 자리의 감각을 가만히 느껴보세요.',
    '움직이지 않아도 이어지는 숨을 살펴보세요.',
    '주변의 소리와 기척을 잠깐 바라보세요.',
  ],
  '집중하고 싶어요': [
    '지금 가장 가까운 감각 하나에 머물러보세요.',
    '주의가 흩어지면 알아차리고 천천히 돌아와보세요.',
    '한 번에 하나의 움직임을 살펴보세요.',
  ],
  '천천히 머물고 싶어요': [
    '숨을 조금 천천히 이어가보세요.',
    '다음 움직임으로 넘어가기 전 잠깐 멈춰보세요.',
    '서두르고 있음을 알아차리면 속도를 살펴보세요.',
  ],
  '그냥 있어보고 싶어요': [
    '지금의 모습 그대로 잠깐 있어보세요.',
    '무언가 하려는 마음도 가볍게 바라보세요.',
    '떠오르는 감각을 판단하지 않고 지나가게 두어보세요.',
  ],
  '잘 모르겠어요': [
    '지금 끌리는 방식으로 시작해보세요.',
    '몸과 마음이 원하는 방향을 잠깐 살펴보세요.',
  ],
}

// Intro 시점의 background prewarm에 쓰는, 결과 카드에서 예상 가능한 모든 기본 문자입니다.
// 직접 입력은 결과 생성 시 필요한 문자만 추가로 요청합니다.
export const CHECKIN_EXPORT_PREWARM_TEXT = [
  ...Object.values(CHECKIN_COPY).flatMap((value) =>
    Array.isArray(value) ? value : typeof value === 'string' ? [value] : [],
  ),
  ...BODY_OPTIONS,
  ...MIND_OPTIONS,
  ...INTENTION_OPTIONS,
  ...Object.values(INTENTION_TIPS).flat(),
  '일요일월요일화요일수요일목요일금요일토요일오전오후0123456789.·:',
].join('')

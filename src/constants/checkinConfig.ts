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
  intentionLabel: '오늘의 의도',
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

// Intro 시점의 background prewarm에 쓰는, 결과 카드에서 예상 가능한 모든 기본 문자입니다.
// 직접 입력은 결과 생성 시 필요한 문자만 추가로 요청합니다.
export const CHECKIN_EXPORT_PREWARM_TEXT = [
  ...Object.values(CHECKIN_COPY).flatMap((value) =>
    Array.isArray(value) ? value : typeof value === 'string' ? [value] : [],
  ),
  ...BODY_OPTIONS,
  ...MIND_OPTIONS,
  ...INTENTION_OPTIONS,
  '일요일월요일화요일수요일목요일금요일토요일오전오후0123456789.·:',
].join('')

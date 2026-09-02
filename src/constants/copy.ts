export const COPY = {
  landing: {
    title: '잠깐명상',
    startAriaLabel: '잠깐명상 시작하기',
    titleLines: ['모래시계를 눌러 시작해요'],
    descriptionLines: ['휴대폰을 내려놓고', '잠깐 멈춰볼까요?'],
    longSession: (duration: string) => `${duration} 동안 머물러요`,
  },
  pause: {
    title: '지금, 여기',
    descriptionLines: ['주변을 바라봐도 좋고', '눈을 감아도 좋아요'],
  },
  openEnded: {
    title: (duration: string) =>
      `${duration}${duration.endsWith('초') ? '가' : '이'} 지났어요`,
    descriptionLines: [
      ['더 머물러도 좋아요', '마치고 싶을 때 화면을 눌러주세요'],
    ],
  },
  reflection: {
    question: '잠깐, 하나만 기록해요',
    guide: '지금 떠오르는 무엇이든 좋아요',
    keywordPlaceholder: '키워드 하나',
    noteLabel: '조금 더 길게 남기고 싶다면',
    notePlaceholder: '예) 생각보다 하늘이 빠르게 움직이고 있었다.',
    placeLabel: '어디에서 머물렀나요?',
    placeAction: '+ 장소 남기기',
    placePlaceholder: '예) 석촌호수',
    validationKeyword: '키워드 하나만 남겨주세요',
    fontCycleAria: '글씨체 바꾸기',
    submit: '기록 남기기',
  },
  result: {
    title: '잠깐, 멈춘 기록',
    duration: (duration: string) => `${duration} 머물렀어요.`,
    place: (place: string) => `${place}에서`,
    share: '공유하기',
    download: '이미지로 저장하기',
    preparingShare: '공유 준비 중...',
    preparingImage: '이미지 만드는 중...',
    shareUnavailable: '이미지로 저장해 직접 공유할 수 있어요.',
    shareError: '공유하지 못했어요. 이미지로 저장해 직접 공유할 수 있어요.',
    imageError: '이미지를 만들지 못했어요. 다시 한 번 시도해주세요.',
    privacy: '이 기록은 화면을 나가면 사라져요',
    saveHint: '',
    downloadHint: '',
    restart: '처음으로',
  },
  time: {
    hours: (value: number) => `${value}시간`,
    minutes: (value: number) => `${value}분`,
    seconds: (value: number) => `${value}초`,
  },
} as const

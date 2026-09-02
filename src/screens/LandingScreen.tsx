import Hourglass from '../components/Hourglass'

type LandingScreenProps = {
  sandColor: string
  onStart: () => void
}

function LandingScreen({ sandColor, onStart }: LandingScreenProps) {
  return (
    <main className="screen landing-screen">
      <div className="screen-content landing-content">
        <h1 className="landing-title">잠깐명상</h1>
        <button
          className="hourglass-button"
          type="button"
          aria-label="잠깐명상 시작하기"
          onClick={onStart}
        >
          <Hourglass progress={1} color={sandColor} />
        </button>
        <p className="landing-instruction">
          화면을 터치해
          <br />
          모래시계를 뒤집어보세요.
        </p>
        <p className="secondary-text">
          휴대폰을 내려놓고
          <br />
          잠깐 주변을 바라봐요.
        </p>
      </div>
    </main>
  )
}

export default LandingScreen

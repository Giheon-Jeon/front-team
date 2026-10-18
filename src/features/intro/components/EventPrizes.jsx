import { PrizeTotal, PrizeList, SpecialAwards } from "./Prizes.jsx";

export default function EventPrizes() {
  return (
    <section
      id="prizes"
      className="event-section prize-section"
      aria-labelledby="prizes-title"
    >
      <h2 id="prizes-title">시상 안내</h2>
      <div className="prize-layout">
        <div className="prize-total">
          <span>총 시상액</span>
          <PrizeTotal />
          <p className="prize-caption">트랙별 TOP 3와 안랩 대표상</p>
        </div>
        <div className="prize-details">
          <SpecialAwards />
          <PrizeList />
        </div>
      </div>
    </section>
  );
}

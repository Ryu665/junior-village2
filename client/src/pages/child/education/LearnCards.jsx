import { useEffect, useState } from "react";
import BackHeader from "../../../components/common/BackHeader";
import Card from "../../../components/common/Card";
import { fetchEducationCards } from "../../../api/education";

export default function LearnCards() {
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    fetchEducationCards().then(setCards);
  }, []);

  if (cards.length === 0) {
    return (
      <div>
        <BackHeader title="배움 콘텐츠" tone="junior" />
        <p className="text-center text-gray-400 py-16">콘텐츠를 불러오는 중이에요...</p>
      </div>
    );
  }

  const card = cards[index];

  return (
    <div>
      <BackHeader title="배움 콘텐츠" tone="junior" />
      <div className="p-4 flex flex-col gap-4">
        <p className="text-center text-sm text-gray-400">
          {index + 1} / {cards.length}
        </p>
        <Card key={card.id} className="min-h-[280px] flex flex-col items-center justify-center text-center animate-pop-in bg-junior-50">
          <div className="text-6xl mb-4">{card.emoji}</div>
          <h2 className="font-extrabold text-xl text-gray-800 mb-3">{card.title}</h2>
          <p className="text-gray-600 leading-relaxed">{card.body}</p>
        </Card>

        <div className="flex gap-3">
          <button
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            className="btn-big flex-1 bg-gray-100 text-gray-600 disabled:opacity-40"
          >
            {"< 이전"}
          </button>
          <button
            disabled={index === cards.length - 1}
            onClick={() => setIndex((i) => Math.min(cards.length - 1, i + 1))}
            className="btn-big flex-1 bg-junior-500 text-white disabled:opacity-40"
          >
            {"다음 >"}
          </button>
        </div>
      </div>
    </div>
  );
}

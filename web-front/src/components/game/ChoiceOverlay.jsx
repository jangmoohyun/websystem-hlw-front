// src/components/game/ChoiceOverlay.jsx
export default function ChoiceOverlay({ choices, onChoice }) {
  return (
    <div className="choice-overlay">
      <div className="choice-modal" onClick={(e) => e.stopPropagation()}>
        {choices.map((label, idx) => (
          <button
            key={idx}
            className="choice-button"
            onClick={() => onChoice(idx)}
          >
            {idx + 1}. {label}
          </button>
        ))}
      </div>
    </div>
  );
}

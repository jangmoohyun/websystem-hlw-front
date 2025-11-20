// src/components/game/DialogueBox.jsx
export default function DialogueBox({
  speaker,
  text,
  isAnimating,
  onAdvance,
  onSkip,
}) {
  return (
    <div className="dialogue-box" onClick={onAdvance}>
      <div className="dialogue-header">
        <span className="speaker-name">{speaker}</span>
      </div>
      <div className="dialogue-text">
        {text}
        {isAnimating && <span className="cursor">▌</span>}
      </div>
      <button
        type="button"
        className="skip-button"
        onClick={(e) => {
          e.stopPropagation();
          onSkip();
        }}
      >
        →
      </button>
    </div>
  );
}

// src/components/game/AlertPopup.jsx
export default function Alert({ message, onClose }) {
  return (
    <div
      className="absolute inset-0 bg-[rgba(0,0,0,0.45)] 
                   flex items-center justify-center z-40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[12px] p-6 w-[300px] text-center shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[20px] mb-4">{message}</p>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded-[8px]"
          onClick={onClose}
        >
          확인
        </button>
      </div>
    </div>
  );
}

import React from "react";

export default function SubmittingOverlay({
  message = "제출 중... 채점 중입니다. 잠시만 기다려주세요.",
}) {
  return (
    <div
      className="absolute inset-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center z-40"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="
          w-[360px] p-6 bg-white/90 backdrop-blur-sm rounded-lg
          flex flex-col items-center gap-4 text-center
        "
      >
        <div className="w-16 h-16 border-4 border-t-4 border-gray-300 border-t-purple-500 rounded-full animate-spin" />
        <div className="text-lg font-medium">{message}</div>
        <div className="text-sm text-gray-600">
          채점 결과를 잠시 후 알려드리겠습니다.
        </div>
      </div>
    </div>
  );
}

import React from "react";

export default function ResultOverlay({ result, onClose }) {
  if (!result) return null;

  const { passed, testResults = [], appliedAffinities = [] } = result;
  const okCount = testResults.filter((t) => t.ok).length;
  const total = testResults.length;

  return (
    <div
      className="absolute inset-0 bg-[rgba(0,0,0,0.45)] flex items-center justify-center z-50"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-[90%] max-w-[900px] bg-white rounded-lg p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2
            className={`text-2xl font-semibold ${
              passed ? "text-green-600" : "text-red-600"
            }`}
          >
            {passed ? "채점 통과" : "채점 실패"}
          </h2>
          <div className="text-sm text-gray-600">
            {okCount}/{total} 테스트 통과
          </div>
        </div>

        <div className="mb-4">
          <div className="text-sm text-gray-700">테스트 상세 정보</div>
          <div className="mt-2 overflow-auto max-h-[300px] border rounded">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">입력</th>
                  <th className="px-3 py-2">출력(예상)</th>
                  <th className="px-3 py-2">결과</th>
                  <th className="px-3 py-2">시간(s)</th>
                  <th className="px-3 py-2">메모리(KB)</th>
                </tr>
              </thead>
              <tbody>
                {testResults.map((t, i) => (
                  <tr
                    key={i}
                    className={`${t.ok ? "bg-green-50" : "bg-red-50"}`}
                  >
                    <td className="px-3 py-2 align-top">{i + 1}</td>
                    <td className="px-3 py-2 align-top whitespace-pre-wrap max-w-[200px]">
                      {String(t.input ?? "")}
                    </td>
                    <td className="px-3 py-2 align-top whitespace-pre-wrap max-w-[200px]">
                      {String(t.expected ?? "")}
                    </td>
                    <td className="px-3 py-2 align-top">
                      {t.ok ? "OK" : "FAIL"}
                    </td>
                    <td className="px-3 py-2 align-top">{t.time ?? "-"}</td>
                    <td className="px-3 py-2 align-top">{t.memory ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {appliedAffinities && appliedAffinities.length > 0 && (
          <div className="mb-4">
            <div className="text-sm font-medium">적용된 호감도 변화</div>
            <ul className="mt-2 list-disc pl-5 text-sm">
              {appliedAffinities.map((a, i) => (
                <li
                  key={i}
                >{`${a.heroine}: ${a.delta} (now ${a.likeValue})`}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            onClick={onClose}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

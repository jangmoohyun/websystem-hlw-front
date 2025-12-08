import React, { useEffect, useState } from "react";
import useSaveManager from "./useSaveManager";

// 간단한 슬롯 세이브 UI 컴포넌트
// Props:
// - storyId: 현재 스토리 ID
// - lineIndex: 현재 인덱스
// - heroineLikes: [{ heroineId, likeValue }, ...] (선택)
// - onLoad: load 후 적용할 콜백: (saveData) => void
export default function SaveMenu({
  storyId,
  lineIndex,
  heroineLikes = [],
  onLoad,
  mode = "save",
}) {
  const { getSaves, saveGame, loadGame } = useSaveManager();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSaves();
      setSlots(data || []);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleSave = async (slot) => {
    setLoading(true);
    setError(null);
    try {
      await saveGame({ slot, storyId, lineIndex, heroineLikes });
      await refresh();
      alert(`저장 완료: 슬롯 ${slot}`);
    } catch (e) {
      setError(e.message || String(e));
      alert("저장 실패: " + (e.message || e));
    } finally {
      setLoading(false);
    }
  };

  const handleLoad = async (slot) => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadGame({ slot });
      if (onLoad) onLoad(data);
      alert(`불러오기 완료: 슬롯 ${slot}`);
    } catch (e) {
      setError(e.message || String(e));
      alert("불러오기 실패: " + (e.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: 12,
        borderRadius: 6,
        maxWidth: 420,
      }}
    >
      <h3>세이브 슬롯</h3>
      {loading && <div>로딩...</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
      <div>
        {Array.from({ length: 5 }).map((_, i) => {
          const slotNum = i + 1;
          const s = slots.find((x) => x.slot === slotNum);
          return (
            <div
              key={slotNum}
              style={{
                marginBottom: 8,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div style={{ flex: 1 }}>
                <strong>슬롯 {slotNum}</strong>
                <div style={{ fontSize: 12 }}>
                  {s && !s.isEmpty ? (
                    <>
                      <div>스토리: {s.story?.title ?? s.story?.id}</div>
                      <div>인덱스: {s.lineIndex}</div>
                    </>
                  ) : (
                    <div>비어있음</div>
                  )}
                </div>
              </div>
              <div>
                  {mode === "save" && (
                      <button
                          onClick={() => handleSave(slotNum)}
                          disabled={loading}
                      >
                          저장
                      </button>
                  )}
                <button
                  onClick={() => handleLoad(slotNum)}
                  style={{ marginLeft: 6 }}
                >
                  불러오기
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

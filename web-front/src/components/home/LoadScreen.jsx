import SaveMenu from "../common/SaveMenu";

export default function LoadScreen({ onLoaded, onCancel }) {
    return (
        <div className="w-full h-full flex items-center justify-center bg-black/40">
            <div className="bg-white p-4 rounded-lg">
                <h2 className="text-lg font-bold mb-2">이어하기</h2>
                <p className="text-sm mb-3">불러올 세이브 슬롯을 선택하세요.</p>

                <SaveMenu
                    // storyId, lineIndex는 로드 전용이므로 굳이 안 써도 됨
                    storyId={null}
                    lineIndex={null}
                    heroineLikes={[]}
                    mode="loadOnly"
                    onLoad={(saveData) => {
                        if (!saveData) return;
                        onLoaded(saveData);  // App으로 전달 → GameScreen으로 진입
                    }}
                />

                <button
                    className="mt-3 px-3 py-1 border rounded text-sm"
                    onClick={onCancel}
                >
                    취소
                </button>
            </div>
        </div>
    );
}
// src/components/user/UserPage.jsx
import React, { useState, useEffect } from "react";
import { apiCall } from "../../utils/api.js";
import LoadOverlay from "../common/LoadOverlay.jsx";

export default function UserPage({ onBack }) {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserPage();
  }, []);

  const fetchUserPage = async () => {
    try {
      setLoading(true);
      const response = await apiCall("/users/me/page", {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("유저 페이지 정보를 가져오는데 실패했습니다.");
      }

      const data = await response.json();
      if (data.success) {
        setUserData(data.data);
      } else {
        throw new Error(data.message || "데이터를 불러오는데 실패했습니다.");
      }
    } catch (err) {
      console.error("유저 페이지 로드 오류:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadOverlay />;
  }

  if (error) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-pink-100">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-pink-400 text-white rounded hover:bg-pink-500"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-pink-100">
        <p>데이터가 없습니다.</p>
      </div>
    );
  }

  const { user, progresses, heroineLikes } = userData;

  return (
    <div className="w-screen h-screen bg-pink-100 overflow-y-auto font-['Pretendard','Noto Sans KR',system-ui]">
      <div className="max-w-4xl mx-auto p-8">
        {/* 헤더 */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="mb-4 px-4 py-2 bg-pink-400 text-white rounded hover:bg-pink-500 transition-colors"
          >
            ← 돌아가기
          </button>
          <h1 className="text-3xl font-bold text-gray-800">유저 페이지</h1>
        </div>

        {/* 유저 정보 카드 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">내 정보</h2>
          <div className="space-y-2">
            <p className="text-gray-700">
              <span className="font-semibold">닉네임:</span> {user.nickname}
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">이메일:</span> {user.email}
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">가입일:</span>{" "}
              {new Date(user.createdAt).toLocaleDateString("ko-KR")}
            </p>
          </div>
        </div>

        {/* 진행 상황 카드 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">진행 상황</h2>
          {progresses && progresses.length > 0 ? (
            <div className="space-y-4">
              {progresses.map((progress) => (
                <div
                  key={progress.id}
                  className="border border-pink-200 rounded-lg p-4 hover:bg-pink-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-800">
                        슬롯 {progress.slot}
                      </p>
                      {progress.story && (
                        <p className="text-gray-600 text-sm mt-1">
                          {progress.story.title}
                        </p>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      라인 {progress.lineIndex}
                    </span>
                  </div>
                  {progress.story && progress.story.image && (
                    <div className="mt-2">
                      <img
                        src={progress.story.image}
                        alt={progress.story.title}
                        className="w-full h-32 object-cover rounded"
                      />
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    마지막 업데이트:{" "}
                    {new Date(progress.updatedAt).toLocaleString("ko-KR")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">진행 중인 스토리가 없습니다.</p>
          )}
        </div>

        {/* 히로인 호감도 카드 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">히로인 호감도</h2>
          {heroineLikes && heroineLikes.length > 0 ? (
            <div className="space-y-4">
              {heroineLikes.map((item, index) => (
                <div
                  key={index}
                  className="border border-pink-200 rounded-lg p-4 hover:bg-pink-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {item.heroine.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {item.heroine.language}
                      </p>
                    </div>
                    <div className="text-right">
                      {item.likes && item.likes.length > 0 ? (
                        <div>
                          {item.likes.map((like, likeIndex) => (
                            <p key={likeIndex} className="text-pink-600 font-semibold">
                              호감도: {like.likeValue}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400">호감도 없음</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">히로인 호감도 정보가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}

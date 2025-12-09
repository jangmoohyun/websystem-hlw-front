// src/utils/api.js
// CloudFront를 프록시로 사용하므로, 동일 Origin 상대경로로 호출한다.
// (배포 환경: https://<cloudfront-domain>/users/..., /progress/... 등)
// 토큰 저장/조회
export const getAccessToken = () => {
  return localStorage.getItem("accessToken");
};

export const getRefreshToken = () => {
  return localStorage.getItem("refreshToken");
};

export const setTokens = (accessToken, refreshToken) => {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
};

export const removeTokens = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
};

// 토큰 갱신
let isRefreshing = false;
let refreshPromise = null;

export const refreshAccessToken = async () => {
  if (isRefreshing) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        throw new Error("리프레시 토큰이 없습니다.");
      }

      const response = await fetch(`/users/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "토큰 갱신 실패");
      }

      // 새 액세스 토큰 저장
      localStorage.setItem("accessToken", data.data.accessToken);
      return data.data.accessToken;
    } catch (error) {
      // 리프레시 토큰도 만료된 경우
      removeTokens();
      throw error;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

// API 호출 함수
export const apiCall = async (url, options = {}) => {
  const accessToken = getAccessToken();

  // 헤더 설정
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  try {
    // url은 항상 "/users/...", "/progress/..." 형태의 절대 경로를 기대한다.
    let response = await fetch(url, {
      ...options,
      headers,
    });

    // 401 에러 시 토큰 갱신 시도
    if (response.status === 401 && accessToken) {
      try {
        const newAccessToken = await refreshAccessToken();
        // 새 토큰으로 재시도
        headers.Authorization = `Bearer ${newAccessToken}`;
        response = await fetch(url, {
          ...options,
          headers,
        });
      } catch (refreshError) {
        // 토큰 갱신 실패 시 로그아웃 처리
        removeTokens();
        window.location.href = "/";
        throw refreshError;
      }
    }

    return response;
  } catch (error) {
    throw error;
  }
};

// 토큰 만료 시간 확인 및 자동 갱신
export const checkAndRefreshToken = async () => {
  const accessToken = getAccessToken();
  if (!accessToken) return;

  try {
    // 토큰 디코딩 (검증 없이)
    const payload = JSON.parse(atob(accessToken.split(".")[1]));
    const expiresAt = payload.exp * 1000; // 밀리초로 변환
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;

    // 만료 5분 전이면 자동 갱신
    if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
      await refreshAccessToken();
    }
  } catch (error) {
    console.error("토큰 확인 중 오류:", error);
  }
};


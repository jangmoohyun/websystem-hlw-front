// 중앙화된 히로인 -> Judge0 언어 ID 매핑 및 헬퍼
export const HEROINE_LANGUAGE_MAP = {
  이시현: 50, // C
  파인선: 71, // Python
  유자빈: 91, // Java
};

// storyHeroines로부터 적절한 languageId를 결정
export function chooseLanguageId(speakerName, storyHeroines) {
  // 우선 스피커 이름이 히로인 목록에 있으면 그걸 쓰고, 없으면 storyHeroines[0]
  let chosen = null;
  if (speakerName && Array.isArray(storyHeroines)) {
    const found = storyHeroines.find((h) => h.name === speakerName);
    if (found) chosen = found;
  }

  if (!chosen && Array.isArray(storyHeroines) && storyHeroines.length > 0) {
    chosen = storyHeroines[0];
  }

  if (chosen) {
    const langField = (chosen.language || "").toString().toLowerCase().trim();
    if (langField) {
      if (langField.includes("python")) return HEROINE_LANGUAGE_MAP["파인선"];
      if (langField.includes("java")) return HEROINE_LANGUAGE_MAP["유자빈"];
      if (langField === "c" || langField.includes("c"))
        return HEROINE_LANGUAGE_MAP["이시현"];
    }
    return HEROINE_LANGUAGE_MAP[chosen.name] ?? HEROINE_LANGUAGE_MAP["파인선"];
  }

  // 기본값: Python
  return HEROINE_LANGUAGE_MAP["파인선"];
}

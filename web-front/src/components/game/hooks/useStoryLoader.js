import { useEffect, useRef, useState } from "react";

// 스토리 로더 훅: storyId를 받아 스크립트를 불러오고 정규화합니다.
export default function useStoryLoader(storyId) {
  const [scriptLines, setScriptLines] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const indexMapRef = useRef(new Map());
  const [heroineCount, setHeroineCount] = useState(0);

  useEffect(() => {
    if (!storyId) return;
    let mounted = true;
    const fetchStory = async () => {
      try {
        const backendUrl =
          "https://hlw-back-dev-alb-1292379324.ap-northeast-2.elb.amazonaws.com";
        setLoading(true);
        const res = await fetch(`${backendUrl}/stories/${storyId}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const json = await res.json();

        let lines = json?.data?.script?.line ?? json?.script ?? null;
        if (!lines) {
          if (!mounted) return;
          setScriptLines([]);
          return;
        }

        if (typeof lines === "string") {
          try {
            lines = JSON.parse(lines);
            // eslint-disable-next-line no-unused-vars
          } catch (e) {
            lines = [];
          }
        }

        if (!Array.isArray(lines)) {
          if (Array.isArray(lines?.lines)) lines = lines.lines;
          else if (Array.isArray(lines?.nodes)) lines = lines.nodes;
          else lines = [];
        }

        const normalized = lines.map((node, i) => {
          const clone = { ...(node ?? {}) };
          if (clone.index === undefined || clone.index === null)
            clone.index = i;
          else clone.index = Number(clone.index);
          return clone;
        });

        // index map
        const map = new Map();
        normalized.forEach((n, i) => map.set(Number(n.index), i));
        indexMapRef.current = map;

        // detect heroine count by known names
        const knownHeroineNames = ["시현", "유자빈", "파인선"];
        const found = new Set();
        normalized.forEach((n) => {
          if (
            typeof n.speaker === "string" &&
            knownHeroineNames.includes(n.speaker)
          )
            found.add(n.speaker);
          if (Array.isArray(n.dialogues)) {
            n.dialogues.forEach((d) => {
              if (d?.speaker && knownHeroineNames.includes(d.speaker))
                found.add(d.speaker);
            });
          }
        });

        if (!mounted) return;
        setHeroineCount(found.size);
        setScriptLines(normalized);
      } catch (err) {
        if (!mounted) return;
        setError(err);
        setScriptLines([]);
      } finally {
        // eslint-disable-next-line no-unsafe-finally
        if (!mounted) return;
        setLoading(false);
      }
    };

    fetchStory();
    return () => {
      mounted = false;
    };
  }, [storyId]);

  return { scriptLines, indexMapRef, heroineCount, loading, error };
}

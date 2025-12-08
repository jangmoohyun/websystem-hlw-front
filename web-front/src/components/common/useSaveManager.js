import { useCallback } from "react";
import {getAccessToken} from "../../utils/api.js";

const API_BASE = "";

export function useSaveManager() {
  const getSaves = useCallback(async () => {
      const token = getAccessToken();
      const headers = {
          "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/progress/saves`, {
      method: "GET",
      headers,
      credentials: "include",
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to get saves");
    return json.data;
  }, []);

  const saveGame = useCallback(
    async ({ slot, storyId, lineIndex, heroineLikes }) => {
        const token = getAccessToken();
        const headers = {
            "Content-Type": "application/json",
        };
        if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/progress/save`, {
        method: "PUT",
        headers,
        credentials: "include",
        body: JSON.stringify({ slot, storyId, lineIndex, heroineLikes }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to save");
      return json.data;
    },
    []
  );

  const loadGame = useCallback(async ({ slot }) => {
      const token = getAccessToken();
      const headers = {
          "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(
      `${API_BASE}/progress/save?slot=${encodeURIComponent(slot)}`,
      {
        method: "GET",
        headers,
        credentials: "include",
      }
    );
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to load");
    return json.data;
  }, []);

  return { getSaves, saveGame, loadGame };
}

export default useSaveManager;

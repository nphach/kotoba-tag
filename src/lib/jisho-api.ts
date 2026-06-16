import { API_BASE } from "./api.ts";

const NETWORK_MESSAGE =
  "couldn't reach the dictionary — check your connection and try again";
const LOOKUP_FAILED_MESSAGE = "dictionary lookup failed — try again";

export type JishoEntry = {
  japanese: { word?: string; reading: string }[];
  senses: {
    parts_of_speech: string[];
    english_definitions: string[];
  }[];
};

export async function fetchJisho(keyword: string): Promise<JishoEntry[]> {
  let response: Response;
  try {
    response = await fetch(
      `${API_BASE}/tag-word?req=${encodeURIComponent(keyword)}`,
    );
  } catch {
    throw new Error(NETWORK_MESSAGE);
  }

  const res = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail =
      typeof res.detail === "string" ? res.detail : LOOKUP_FAILED_MESSAGE;
    throw new Error(detail);
  }

  if (!res.data || res.data.length === 0) {
    return [];
  }

  return res.data as JishoEntry[];
}

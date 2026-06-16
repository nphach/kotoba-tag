import { API_BASE } from "./api.ts";
import { readApiErrorDetail } from "./errors.ts";

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

  if (!response.ok) {
    const detail = await readApiErrorDetail(response, LOOKUP_FAILED_MESSAGE);
    throw new Error(detail);
  }

  const res = await response.json().catch(() => ({}));

  if (!res.data || res.data.length === 0) {
    return [];
  }

  return res.data as JishoEntry[];
}

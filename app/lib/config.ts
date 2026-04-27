export const API_BASE_URL = "https://gauntlet-s6g1.onrender.com";

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

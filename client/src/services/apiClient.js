import { storageService } from "./storage.service.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export async function apiClient(urlPath, opts) {
  const options = opts || {};
  const method = options.method || "GET";
  const body = options.body;
  const auth = options.auth !== false;

  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = storageService.getToken();
    if (token) headers.Authorization = "Bearer " + token;
  }

  const res = await fetch(API_URL + urlPath, {
    method: method,
    headers: headers,
    body: body ? JSON.stringify(body) : undefined
  });

  let data = {};
  try { data = await res.json(); } catch { data = {}; }
  if (!res.ok) {
    throw new Error(data && data.error ? data.error : ("Request failed (" + res.status + ")"));
  }
  return data;
}

/**
 * Clean HTTP client with automatic token refresh and error handling.
 * Adapted from the web app for React Native (no DOM APIs).
 */

import { API_BASE_URL } from "../lib/config";
import { tokenManager } from "./tokenManager";

const REQUEST_TIMEOUT = 30000; // 30s
let _refreshPromise = null;

export class ApiError extends Error {
  constructor(message, { status, data } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status ?? 0;
    this.data = data ?? {};
  }
}

async function parseBody(res) {
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
  const text = await res.text();
  return text || null;
}

export function extractErrorMessage(payload, fallback = "حدث خطأ غير متوقع") {
  if (!payload) return fallback;
  if (typeof payload === "string") return payload;
  if (payload.detail) return String(payload.detail);
  if (Array.isArray(payload.non_field_errors))
    return payload.non_field_errors.join(" ");
  if (typeof payload === "object") {
    for (const v of Object.values(payload)) {
      if (Array.isArray(v) && v.length) return String(v[0]);
      if (typeof v === "string") return v;
    }
  }
  return fallback;
}

export async function request(
  path,
  {
    method = "GET",
    body,
    headers = {},
    auth = true,
    signal,
    _retry = false,
    paginated = false,
  } = {}
) {
  const url = `${API_BASE_URL}${path}`;
  const finalHeaders = { 
    Accept: "application/json", 
    "Bypass-Tunnel-Reminder": "true",
    ...headers 
  };

  let payload;
  if (body !== undefined && body !== null) {
    if (body instanceof FormData) {
      payload = body;
    } else {
      finalHeaders["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }
  }

  if (auth) {
    const token = tokenManager.getToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  const mergedSignal = signal || controller.signal;

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: payload,
      signal: mergedSignal,
    });
  } catch (err) {
    throw new ApiError(
      "تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.",
      { status: 0, data: { detail: err.message } }
    );
  } finally {
    clearTimeout(timeout);
  }

  // Silent refresh on 401
  if (response.status === 401 && auth && !_retry) {
    try {
      return request(path, { method, body, headers, auth, signal, _retry: true });
    } catch {
      throw new ApiError("انتهت الجلسة. يرجى تسجيل الدخول مجدداً.", {
        status: 401,
      });
    }
  }

  const data = await parseBody(response);
  if (!response.ok) {
    throw new ApiError(extractErrorMessage(data, response.statusText), {
      status: response.status,
      data,
    });
  }

  if (
    data !== null &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    "results" in data &&
    "count" in data
  ) {
    return paginated ? data : data.results;
  }

  return data;
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: "GET" }),
  getPaginated: (path, opts) =>
    request(path, { ...opts, method: "GET", paginated: true }),
  post: (path, body, opts) => request(path, { ...opts, method: "POST", body }),
  put: (path, body, opts) => request(path, { ...opts, method: "PUT", body }),
  patch: (path, body, opts) =>
    request(path, { ...opts, method: "PATCH", body }),
  del: (path, opts) => request(path, { ...opts, method: "DELETE" }),
};

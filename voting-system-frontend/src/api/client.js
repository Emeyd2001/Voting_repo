/**
 * Clean HTTP client with automatic token refresh and error handling.
 * Security: Access tokens in memory, refresh tokens in HttpOnly cookies.
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

/**
 * Parse response body safely
 */
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

export function extractErrorMessage(
  payload,
  fallback = "حدث خطأ غير متوقع",
) {
  if (!payload) return fallback;

  // إذا كان الرد عبارة عن صفحة HTML (غالباً خطأ 404 أو 500 من Django)
  if (typeof payload === "string") {
    if (payload.trim().startsWith("<!DOCTYPE") || payload.includes("<html")) {
      return "خطأ في السيرفر أو المسار غير موجود (404/500)";
    }
    return payload;
  }

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

/**
 * Core HTTP request function with automatic token refresh
 */
export async function request(
  path,
  {
    method = "GET",
    body,
    headers = {},
    auth = true,
    signal,
    _retry = false,
    paginated = false, // إذا true يُرجع { count, next, previous, results } كاملاً
  } = {},
) {
  const url = `${API_BASE_URL}${path}`;
  const finalHeaders = { Accept: "application/json", ...headers };

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
      // credentials: "include",
      signal: mergedSignal,
    });
  } catch (err) {
    throw new ApiError("تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.", {
      status: 0,
      data: { detail: err.message },
    });
  } finally {
    clearTimeout(timeout);
  }

  // Silent refresh on 401
  if (response.status === 401 && auth && !_retry) {
    try {
      // await refreshAccessToken();
      return request(path, {
        method,
        body,
        headers,
        auth,
        signal,
        _retry: true,
      });
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

  // الرد المُقسَّم من DRF: { count, next, previous, results }
  if (
    data !== null &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    "results" in data &&
    "count" in data
  ) {
    // paginated:true → يُرجع الكائن كاملاً (للـ Server-Side Pagination)
    // paginated:false (افتراضي) → يُرجع results[] فقط (للـ hooks القديمة)
    return paginated ? data : data.results;
  }

  return data;
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: "GET" }),
  // يُرجع الكائن الكامل { count, next, previous, results } للـ Server-Side Pagination
  getPaginated: (path, opts) => request(path, { ...opts, method: "GET", paginated: true }),
  post: (path, body, opts) => request(path, { ...opts, method: "POST", body }),
  put: (path, body, opts) => request(path, { ...opts, method: "PUT", body }),
  patch: (path, body, opts) => request(path, { ...opts, method: "PATCH", body }),
  del: (path, opts) => request(path, { ...opts, method: "DELETE" }),
};

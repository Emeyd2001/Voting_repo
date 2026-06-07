/**
 * Simple hooks for async operations with loading/error/data state.
 * No boilerplate. Use directly without Redux/Context wrapping.
 */

import { useCallback, useEffect, useRef, useState, useLayoutEffect } from "react";

// ثابت يتطابق مع PAGE_SIZE في Django settings
export const SERVER_PAGE_SIZE = 10;

/**
 * Fetch data on mount or when dependencies change.
 * @param {() => Promise<T>} fn - Async function to execute
 * @param {Array} deps - Dependencies that trigger re-fetch
 * @returns {{ data: T|null, loading: boolean, error: Error|null, refetch: () => Promise<T> }}
 */
export function useFetch(fn, deps = []) {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null,
  });
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fnRef.current();
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      setState({ data: null, loading: false, error });
      return null;
    }
  }, []);

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, refetch: run };
}

/**
 * Manual mutation (POST/PUT/DELETE).
 * @param {(...args) => Promise<T>} fn - Async function
 * @returns {{ mutate: (...args) => Promise<T>, loading: boolean, error: Error|null, data: T|null }}
 */
export function useMutation(fn) {
  const [state, setState] = useState({
    loading: false,
    error: null,
    data: null,
  });
  const fnRef = useRef(fn);
  useLayoutEffect(() => {
    fnRef.current = fn;
  });

  const mutate = useCallback(async (...args) => {
    setState({ loading: true, error: null, data: null });
    try {
      const data = await fnRef.current(...args);
      setState({ loading: false, error: null, data });
      return data;
    } catch (error) {
      setState({ loading: false, error, data: null });
      throw error;
    }
  }, []);

  return { ...state, mutate };
}

/**
 * Hook للـ Server-Side Pagination.
 * يطلب من الـ Backend صفحة محددة ويدير حالة التنقل بين الصفحات.
 *
 * @param {(page: number) => Promise<{count,next,previous,results}>} makeFn
 *   دالة مصنع تأخذ رقم الصفحة وتُرجع Promise بالبيانات المُقسَّمة.
 * @param {Array} deps  - تغيير أي قيمة يُعيد تعيين الصفحة إلى 1 ويجلب من جديد.
 * @returns {{ data, count, totalPages, page, setPage, loading, error, refetch }}
 */
export function usePaginatedFetch(makeFn, deps = []) {
  const [page, setPage] = useState(1);
  const [state, setState] = useState({
    data: [],
    count: 0,
    loading: true,
    error: null,
  });

  const makeFnRef = useRef(makeFn);
  makeFnRef.current = makeFn;

  const run = useCallback(async (targetPage) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await makeFnRef.current(targetPage);
      const data  = res?.results ?? (Array.isArray(res) ? res : []);
      const count = res?.count   ?? data.length;
      setState({ data, count, loading: false, error: null });
      return res;
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: err }));
      return null;
    }
  }, []);

  // عند تغيير الـ deps الخارجية → أعد تعيين الصفحة إلى 1
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setPage(1); }, deps);

  // عند تغيير رقم الصفحة → اجلب البيانات
  useEffect(() => { run(page); }, [page, run]);

  const totalPages = Math.max(1, Math.ceil(state.count / SERVER_PAGE_SIZE));

  return { ...state, page, setPage, totalPages, refetch: () => run(page) };
}

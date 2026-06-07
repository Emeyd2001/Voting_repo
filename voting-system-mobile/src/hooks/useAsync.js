/**
 * Simple hooks for async operations.
 * Adapted from the web app — no DOM APIs used.
 */
import { useCallback, useEffect, useRef, useState, useLayoutEffect } from "react";

/**
 * Fetch data on mount or when dependencies change.
 */
export function useFetch(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
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
 */
export function useMutation(fn) {
  const [state, setState] = useState({ loading: false, error: null, data: null });
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

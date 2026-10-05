import { useCallback, useEffect, useRef, useState } from 'react';

export const PAGE_SIZE = 4; // use 10 once you have real data

export function usePagedList<T>(
  fetchPage: (from: number, to: number) => Promise<T[]>,
  deps: unknown[] = []
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;
  const page = useRef(0);
  const busy = useRef(false);
  const done = useRef(false);
  const run = useRef(0);

  const loadMore = useCallback(async () => {
    if (busy.current || done.current) return;
    busy.current = true;
    setLoading(true);
    const myRun = run.current;
    const from = page.current * PAGE_SIZE;
    try {
      const data = await fetchRef.current(from, from + PAGE_SIZE - 1);
      if (myRun !== run.current) return; // the filter changed meanwhile
      setItems((prev) => [...prev, ...data]);
      page.current += 1;
      if (data.length < PAGE_SIZE) done.current = true;
    } catch {
      // keep what we have; scrolling again will retry
    }
    if (myRun === run.current) {
      busy.current = false;
      setLoading(false);
    }
  }, []);

  // start over whenever the filter (deps) changes
  useEffect(() => {
    run.current += 1;
    page.current = 0;
    busy.current = false;
    done.current = false;
    setItems([]);
    loadMore();
  }, deps);

  return { items, loading, loadMore };
}
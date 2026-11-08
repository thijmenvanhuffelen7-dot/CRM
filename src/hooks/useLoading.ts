import { useEffect, useState } from "react";

/** Simulates a short network round-trip on first mount so skeletons are exercised. */
const seen = new Set<string>();
export function useLoading(key: string, ms = 450) {
  const [loading, setLoading] = useState(!seen.has(key));
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => {
      seen.add(key);
      setLoading(false);
    }, ms);
    return () => clearTimeout(t);
  }, [key, ms, loading]);
  return loading;
}

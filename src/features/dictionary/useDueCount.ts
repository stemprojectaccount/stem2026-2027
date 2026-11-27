// Number of word-book words due for review (for the menu badge). Loads the review code lazily.
import { useEffect, useState } from "react";

export function useWordbookDueCount(): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    let alive = true;
    let off = () => {};
    const refresh = () =>
      import("./review")
        .then((m) => m.countDue())
        .then((v) => alive && setN(v))
        .catch(() => {});
    const first = window.setTimeout(refresh, 1500); // after the app has started
    import("./dictStore").then((m) => {
      if (alive) off = m.onWordbookChange(refresh);
    });
    const timer = window.setInterval(refresh, 10 * 60 * 1000);
    return () => {
      alive = false;
      off();
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, []);
  return n;
}

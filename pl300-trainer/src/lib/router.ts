import { useEffect, useState, useCallback } from "react";

// Tiny hash router — avoids pulling in react-router (not in the approved stack).

export function useHashRoute(): [string, (to: string) => void] {
  const [hash, setHash] = useState(() => window.location.hash || "#/");

  useEffect(() => {
    const onChange = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  const navigate = useCallback((to: string) => {
    const target = to.startsWith("#") ? to : `#${to}`;
    if (window.location.hash === target) {
      // Force a re-render even when navigating to the same route.
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    } else {
      window.location.hash = target;
    }
    window.scrollTo({ top: 0 });
  }, []);

  return [hash.replace(/^#/, "") || "/", navigate];
}

export function matchRoute(path: string): { name: string; params: string[] } {
  const segs = path.split("/").filter(Boolean);
  return { name: "/" + segs.join("/"), params: segs };
}

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render(element: HTMLElement, options: { sitekey: string; theme: string; callback: (token: string) => void; 'expired-callback': () => void }): string;
      remove(widgetId: string): void;
    };
  }
}

interface TurnstileWidgetProps {
  onToken: (token: string) => void;
  resetSignal: number;
}

export default function TurnstileWidget({ onToken, resetSignal }: TurnstileWidgetProps) {
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const sitekey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

  useEffect(() => {
    if (!sitekey || !container.current) return;
    const scriptId = 'self-mirror-turnstile';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    let widgetId: string | null = null;
    let disposed = false;
    const render = () => {
      if (disposed || widgetId || !container.current || !window.turnstile) return;
      widgetId = window.turnstile.render(container.current, {
        sitekey,
        theme: 'dark',
        callback: onToken,
        'expired-callback': () => onToken(''),
      });
    };
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onerror = () => setError(true);
      document.head.appendChild(script);
    }
    if (window.turnstile) render();
    else script.addEventListener('load', render, { once: true });
    return () => {
      disposed = true;
      script?.removeEventListener('load', render);
      if (widgetId) window.turnstile?.remove(widgetId);
    };
  }, [onToken, resetSignal, sitekey]);

  if (!sitekey) return null;
  return <div className="my-2">{error ? <p className="text-xs text-red-400">Security check could not load.</p> : <div ref={container} aria-label="Cloudflare security verification" />}</div>;
}

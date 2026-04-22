import React from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

const DISMISSED_AT_KEY = 'univibe_pwa_install_dismissed_at';
const INSTALLED_KEY = 'univibe_pwa_installed';
const REMIND_AFTER_MS = 1000 * 60 * 60 * 24 * 7;
const FORCE_SHOW_EVENT = 'univibe:show-install-prompt';

export const isPwaInstalled = () => {
  if (typeof window === 'undefined') return false;

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  return localStorage.getItem(INSTALLED_KEY) === 'true' || isStandalone;
};

export const requestPwaInstallPrompt = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DISMISSED_AT_KEY);
  window.dispatchEvent(new Event(FORCE_SHOW_EVENT));
};

const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = React.useState(false);
  const [canShowPrompt, setCanShowPrompt] = React.useState(false);
  const [showIosHelp, setShowIosHelp] = React.useState(false);

  const isIos = React.useMemo(() => {
    if (typeof window === 'undefined') return false;

    const ua = window.navigator.userAgent.toLowerCase();
    const isAppleMobile = /iphone|ipad|ipod/.test(ua);
    const isSafari = /safari/.test(ua) && !/crios|fxios/.test(ua);
    return isAppleMobile && isSafari;
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const alreadyInstalled = isPwaInstalled();
    if (alreadyInstalled) {
      localStorage.setItem(INSTALLED_KEY, 'true');
      setIsInstalled(true);
      return;
    }

    // Check for global prompt captured in index.html
    if (window.deferredPwaPrompt) {
      setDeferredPrompt(window.deferredPwaPrompt);
    }

    const dismissedAt = Number(localStorage.getItem(DISMISSED_AT_KEY) || 0);
    const canRemind = dismissedAt === 0 || Date.now() - dismissedAt > REMIND_AFTER_MS;
    setCanShowPrompt(canRemind);

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onPromptReady = () => {
      if (window.deferredPwaPrompt) {
        setDeferredPrompt(window.deferredPwaPrompt);
      }
    };

    const onInstalled = () => {
      localStorage.setItem(INSTALLED_KEY, 'true');
      setIsInstalled(true);
      setDeferredPrompt(null);
      window.deferredPwaPrompt = null;
    };

    const onForceShow = () => {
      if (isPwaInstalled()) {
        setIsInstalled(true);
        return;
      }

      setCanShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('pwa:prompt-ready', onPromptReady);
    window.addEventListener('appinstalled', onInstalled);
    window.addEventListener(FORCE_SHOW_EVENT, onForceShow);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('pwa:prompt-ready', onPromptReady);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener(FORCE_SHOW_EVENT, onForceShow);
    };
  }, []);

  const dismissPrompt = () => {
    localStorage.setItem(DISMISSED_AT_KEY, `${Date.now()}`);
    setCanShowPrompt(false);
  };

  const handleInstall = async () => {
    const prompt = deferredPrompt || window.deferredPwaPrompt;
    if (!prompt) return;

    await prompt.prompt();
    const result = await prompt.userChoice;

    if (result.outcome === 'accepted') {
      localStorage.setItem(INSTALLED_KEY, 'true');
      setIsInstalled(true);
      window.deferredPwaPrompt = null;
    } else {
      dismissPrompt();
    }

    setDeferredPrompt(null);
  };

  if (isInstalled || !canShowPrompt) {
    return null;
  }

  const shouldShow = Boolean(deferredPrompt) || isIos;
  if (!shouldShow) {
    return null;
  }

  return (
    <div className="fixed inset-x-3 bottom-28 z-[60] mx-auto w-auto max-w-md rounded-2xl border border-zinc-200 bg-white/95 p-4 shadow-2xl backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95 md:bottom-6">
      <button
        aria-label="Dismiss install prompt"
        onClick={dismissPrompt}
        className="absolute right-2 top-2 rounded-full p-1 text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        <X size={16} />
      </button>

      <div className="pr-6">
        <p className="text-sm font-black text-zinc-900 dark:text-zinc-100">Install UniVibe app</p>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
          Faster launch, better performance, and a native app experience.
        </p>
      </div>

      {Boolean(deferredPrompt) ? (
        <div className="mt-4 flex gap-2">
          <Button onClick={handleInstall} size="sm" className="flex-1 gap-1">
            <Download size={14} />
            Install
          </Button>
          <Button onClick={dismissPrompt} variant="outline" size="sm" className="flex-1">
            Not now
          </Button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {!showIosHelp ? (
            <div className="flex gap-2">
              <Button onClick={() => setShowIosHelp(true)} size="sm" className="flex-1 gap-1">
                <Smartphone size={14} />
                Show steps
              </Button>
              <Button onClick={dismissPrompt} variant="outline" size="sm" className="flex-1">
                Not now
              </Button>
            </div>
          ) : (
            <div className="rounded-xl bg-zinc-50 p-3 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              On iPhone: tap Share in Safari, then choose Add to Home Screen.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PwaInstallPrompt;

import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Download, X } from 'lucide-react';
import Button from './Button';

export default function PwaBadge() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const closeInstallPrompt = () => {
    setShowInstallPrompt(false);
  };

  const closeUpdatePrompt = () => {
    setNeedRefresh(false);
    setOfflineReady(false);
  };

  if (needRefresh || offlineReady) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-white p-4 rounded-xl shadow-2xl border border-green-200 max-w-sm animate-slide-up flex flex-col gap-3">
        <div className="flex justify-between items-start gap-4">
          <p className="text-gray-800 text-sm font-medium">
            {needRefresh
              ? 'A new version of FarmDirect is available.'
              : 'FarmDirect is now ready to work offline.'}
          </p>
          <button onClick={closeUpdatePrompt} className="text-gray-400 hover:text-gray-600 transition">
            <X size={18} />
          </button>
        </div>
        {needRefresh && (
          <Button variant="primary" size="sm" onClick={() => updateServiceWorker(true)} className="w-full">
            Reload & Update
          </Button>
        )}
      </div>
    );
  }

  if (showInstallPrompt) {
    return (
      <div className="fixed bottom-4 left-4 z-50 bg-gradient-to-r from-green-600 to-emerald-600 p-4 rounded-xl shadow-2xl max-w-sm animate-slide-up">
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-3 text-white">
            <div className="bg-white/20 p-2 rounded-lg">
              <Download size={24} />
            </div>
            <div>
              <h4 className="font-bold">Install FarmDirect</h4>
              <p className="text-xs text-green-50">Get the app for faster offline access</p>
            </div>
          </div>
          <button onClick={closeInstallPrompt} className="text-white/70 hover:text-white transition mt-1">
            <X size={18} />
          </button>
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm" onClick={handleInstallClick} className="w-full bg-white text-green-600 border-none hover:bg-gray-50">
            Install App
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

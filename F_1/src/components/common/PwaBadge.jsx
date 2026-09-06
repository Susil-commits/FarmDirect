import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { X } from 'lucide-react';
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

  return null;
}

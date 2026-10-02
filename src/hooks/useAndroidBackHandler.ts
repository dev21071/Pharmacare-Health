import { useEffect, useRef } from 'react';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { unlockAudioContext } from '../services/notifications';

interface AndroidBackHandlerOptions {
  currentScreen: string;
  onGoBack: () => boolean;
  showToast: (type: 'info' | 'warning', title: string, message: string) => void;
}

export function useAndroidBackHandler({
  currentScreen,
  onGoBack,
  showToast,
}: AndroidBackHandlerOptions) {
  const lastBackPressRef = useRef<number>(0);
  const onGoBackRef = useRef(onGoBack);
  onGoBackRef.current = onGoBack;

  // 1. Audio unlock on initial user gesture (Android APK WebViews suspend audio by default)
  useEffect(() => {
    const handleInitialTouch = () => {
      unlockAudioContext();
      window.removeEventListener('touchstart', handleInitialTouch);
      window.removeEventListener('click', handleInitialTouch);
    };

    window.addEventListener('touchstart', handleInitialTouch, { passive: true });
    window.addEventListener('click', handleInitialTouch, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleInitialTouch);
      window.removeEventListener('click', handleInitialTouch);
    };
  }, []);

  // 2. Hardware / Gesture Back Button handling for Capacitor Android APK
  useEffect(() => {
    let removeListener: (() => void) | null = null;

    try {
      if (Capacitor.isNativePlatform() || (Capacitor as unknown as { isPluginAvailable?: (name: string) => boolean }).isPluginAvailable?.('App')) {
        CapApp.addListener('backButton', () => {
          const handled = onGoBackRef.current();
          if (!handled) {
            const now = Date.now();
            if (now - lastBackPressRef.current < 2000) {
              CapApp.exitApp();
            } else {
              lastBackPressRef.current = now;
              showToast('info', 'PharmaCare', 'Press back again to exit the app');
            }
          }
        }).then((listener) => {
          removeListener = () => listener.remove();
        }).catch(() => {
          // Native listener unavailable, fallback to popstate
        });
      }
    } catch {
      // Ignore if CapApp is not available
    }

    // 3. Browser / WebView popstate listener
    const handlePopState = () => {
      const handled = onGoBackRef.current();
      if (!handled) {
        const now = Date.now();
        if (now - lastBackPressRef.current < 2000) {
          // Allow default browser back/exit
        } else {
          lastBackPressRef.current = now;
          showToast('info', 'PharmaCare', 'Press back again to exit the app');
          try {
            window.history.pushState({ screen: currentScreen }, '');
          } catch {
            // Ignore
          }
        }
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      if (removeListener) {
        removeListener();
      }
      window.removeEventListener('popstate', handlePopState);
    };
  }, [currentScreen, showToast]);
}

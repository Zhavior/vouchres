/**
 * Haptics Utility
 * Provides hardware-level tactile feedback for high-friction actions.
 * Safely degrades on unsupported devices (e.g., iOS Safari or desktop).
 */

export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' = 'light') => {
  if (typeof window === 'undefined' || !window.navigator || !window.navigator.vibrate) {
    return;
  }

  try {
    switch (type) {
      case 'light':
        window.navigator.vibrate(10); // A quick tick
        break;
      case 'medium':
        window.navigator.vibrate(20);
        break;
      case 'heavy':
        window.navigator.vibrate(35);
        break;
      case 'success':
        window.navigator.vibrate([10, 30, 20]); // Tick-tick
        break;
    }
  } catch (e) {
    // Ignore errors on devices that block it
  }
};

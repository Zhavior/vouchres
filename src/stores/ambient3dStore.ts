import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * The `3D: ON/OFF` toggle, hoisted out of the individual surfaces.
 *
 * HR Next, Today Next, Live Games Next and Settings each used to own a local
 * `useState(true)`, so the preference reset on every route switch and the three
 * toggles disagreed with each other. One store means one answer, and `persist`
 * carries it across reloads — a user who turns the field off stays off.
 */
type Ambient3dState = {
  enabled: boolean;
  toggle: () => void;
  setEnabled: (enabled: boolean) => void;
};

export const useAmbient3dStore = create<Ambient3dState>()(
  persist(
    (set, get) => ({
      enabled: true,
      toggle: () => set({ enabled: !get().enabled }),
      setEnabled: (enabled) => set({ enabled }),
    }),
    { name: 'vouchedge_ambient_3d' },
  ),
);

/** Selector hook — components that only read the flag don't re-render on setter identity. */
export const useAmbient3dEnabled = () => useAmbient3dStore((state) => state.enabled);

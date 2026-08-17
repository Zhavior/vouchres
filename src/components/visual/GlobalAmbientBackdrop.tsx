import { DecorativeParticleFieldLazy } from './DecorativeParticleFieldLazy';
import { useAmbient3dEnabled } from '@/stores/ambient3dStore';
import { useProfileStore } from '@/stores/profileStore';

/**
 * The app's single ambient 3D backdrop.
 *
 * Mounted once in AppShell, above MainViewRouter — so switching sections
 * (Today, HR Next, HR Max, Live Games, Settings…) swaps the route subtree
 * underneath it while this stays mounted. That is the whole point: the old
 * per-surface layers tore the WebGL context down and rebuilt it on every
 * navigation, which read as a flicker and cost a fresh canvas init each time.
 *
 * Nothing here is per-surface any more. One opacity, one spin rate, one canvas.
 */
export function GlobalAmbientBackdrop() {
  const enabled = useAmbient3dEnabled();
  // The Reduce motion preference used to gate only the Settings copy of this
  // layer. With one shared canvas it has to win everywhere, so it moves here.
  const reduceMotion = useProfileStore((state) => Boolean(state.profile?.reduceMotion));

  return (
    <DecorativeParticleFieldLazy
      surface="global"
      isVisible={enabled && !reduceMotion}
      // Material 0.6 under the wrapper's own opacity-60 lands at ~0.36
      // effective — the density the per-surface layers used to run at, which
      // keeps dense HR tables and terminal type sharp against the obsidian.
      opacity={0.6}
      spin={{ x: -1 / 10, y: -1 / 15 }}
    />
  );
}

export default GlobalAmbientBackdrop;

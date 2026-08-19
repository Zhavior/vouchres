import { Suspense } from 'react';
import type { DecorativeParticleFieldProps } from './DecorativeParticleField';
import { lazyWithRetry } from '../../lib/lazyWithRetry';

/*
 * Lazy boundary for the ambient particle field.
 *
 * The field pulls in three.js and @react-three/fiber — roughly 870 KB that has
 * to download *and evaluate* before React can paint. Imported statically it
 * sits in the critical path of every surface that decorates itself with it
 * (HR Next, Today Next, Live Games, Settings), so the page withholds its
 * first paint on a purely decorative background.
 *
 * Behind this boundary the page paints immediately and the field fades in when
 * its chunk lands. `fallback={null}` because there is nothing meaningful to
 * show in its place — it is decoration, and a placeholder would be more
 * distracting than the brief absence.
 *
 * The isVisible short-circuit is deliberate and sits *before* the Suspense:
 * with the 3D toggle off the chunk is never even requested, so users who turn
 * it off stop paying for it entirely.
 */
const DecorativeParticleFieldImpl = lazyWithRetry(() =>
  import('./DecorativeParticleField').then((m) => ({ default: m.DecorativeParticleField })), { label: 'DecorativeParticleFieldImpl', optional: true });

export function DecorativeParticleFieldLazy(props: DecorativeParticleFieldProps) {
  if (!props.isVisible) return null;

  return (
    <Suspense fallback={null}>
      <DecorativeParticleFieldImpl {...props} />
    </Suspense>
  );
}

export default DecorativeParticleFieldLazy;

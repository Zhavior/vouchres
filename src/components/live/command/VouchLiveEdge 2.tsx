import React from 'react';
import { useVouchLiveEdge } from '../../../hooks/queries/useVouchLiveEdge';

export function VouchLiveEdge({
  gamePk,
}: {
  gamePk: number;
}) {

  const {
    edge,
    data: snap,
    isFetching,
  } = useVouchLiveEdge(gamePk);


  return (
    <section className="
      rounded-2xl
      border
      border-white/10
      bg-black/50
      p-4
    ">

      <div className="flex justify-between items-center">

        <p className="
          text-[10px]
          uppercase
          tracking-widest
          text-white/40
          font-mono
        ">
          Vouch Live Edge
        </p>


        <span
          className="text-[10px] uppercase font-bold"
          style={{
            color: edge.color,
          }}
        >
          {isFetching ? 'Syncing' : 'LIVE'}
        </span>

      </div>


      <h3 className="
        mt-3
        text-xl
        font-black
        text-white
      ">
        {edge.label}
      </h3>


      <div className="
        mt-3
        h-2
        rounded-full
        bg-white/10
        overflow-hidden
      ">
        <div
          className="h-full transition-all"
          style={{
            width: `${edge.score}%`,
            background: edge.color,
          }}
        />
      </div>


      <div className="
        mt-4
        grid
        grid-cols-2
        gap-2
      ">

        <Stat
          label="Batter"
          value={
            snap?.play?.batter.name ?? 'Waiting'
          }
        />

        <Stat
          label="Pitcher"
          value={
            snap?.play?.pitcher.name ?? 'Waiting'
          }
        />

      </div>


      <ul className="
        mt-4
        space-y-2
      ">
        {edge.reasons.map((reason) => (
          <li
            key={reason}
            className="
              text-xs
              text-white/60
            "
          >
            ✓ {reason}
          </li>
        ))}
      </ul>

    </section>
  );
}


function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {

  return (
    <div className="
      rounded-xl
      bg-white/5
      p-2
    ">

      <div className="
        text-[9px]
        uppercase
        text-white/30
      ">
        {label}
      </div>

      <div className="
        mt-1
        text-xs
        font-bold
        text-white
        truncate
      ">
        {value}
      </div>

    </div>
  );
}

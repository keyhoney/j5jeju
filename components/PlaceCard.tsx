'use client';

import { Trash2, ExternalLink, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import type { SchedulePlace } from '../lib/types';
import { formatScheduleTimeLabel } from '../lib/schedule-sort';

interface PlaceCardProps {
  place: SchedulePlace;
  /** 시간 순 정렬 후 1부터 */
  sequence: number;
  onDelete: (id: string) => void;
  onOpen?: (place: SchedulePlace) => void;
  isActive?: boolean;
}

export default function PlaceCard({
  place,
  sequence,
  onDelete,
  onOpen,
  isActive = false,
}: PlaceCardProps) {
  const timeLabel = formatScheduleTimeLabel(place.time);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onOpen?.(place)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen?.(place);
        }
      }}
      className={`relative bg-white rounded-2xl p-[15px] shadow-jeju border border-orange-50 flex gap-3.5 cursor-pointer transition-all ${
        isActive ? 'border-primary/40' : ''
      }`}
    >
      <span
        aria-hidden
        className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full transition-colors ${
          isActive ? 'bg-primary' : 'bg-transparent'
        }`}
      />
      <div className="flex flex-col items-center justify-center bg-orange-50 rounded-xl px-3 py-2 h-fit min-h-11 min-w-11 shrink-0">
        <span className="text-primary font-bold text-lg">{sequence}</span>
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="inline-flex items-center gap-1 text-sm font-extrabold text-secondary bg-orange-50 px-2 py-1 rounded-lg leading-none">
            <Clock size={13} />
            {timeLabel}
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(place.id);
            }}
            className="text-gray-400 hover:text-red-500 transition-colors shrink-0 min-h-9 min-w-9 rounded-lg bg-gray-50 hover:bg-red-50"
            aria-label={`${place.placeName} 삭제`}
          >
            <Trash2 size={16} />
          </button>
        </div>
        <h3 className="text-base font-bold text-gray-800 truncate leading-snug">{place.placeName}</h3>

        {place.memo ? <p className="text-gray-500 text-sm leading-relaxed whitespace-pre-wrap">{place.memo}</p> : null}

        {place.kakaoMapUrl ? (
          <a
            href={place.kakaoMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-secondary transition-colors pt-0.5"
          >
            <ExternalLink size={12} /> 카카오맵에서 열기
          </a>
        ) : null}
      </div>
    </motion.div>
  );
}

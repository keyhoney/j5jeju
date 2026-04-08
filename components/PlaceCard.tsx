'use client';

import { Trash2, ExternalLink, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import type { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import type { SchedulePlace } from '../lib/types';

interface PlaceCardProps {
  place: SchedulePlace;
  /** 화면에 보이는 순번 (목록·지도와 동일하게 1부터) */
  sequence: number;
  onDelete: (id: string) => void;
  onClick?: (id: string) => void;
  isActive?: boolean;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
}

export default function PlaceCard({
  place,
  sequence,
  onDelete,
  onClick,
  isActive = false,
  dragHandleProps,
}: PlaceCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onClick?.(place.id)}
      className={`bg-white rounded-2xl p-4 mb-4 shadow-jeju border flex gap-4 cursor-pointer transition-all ${
        isActive ? 'border-primary ring-2 ring-orange-100' : 'border-orange-50'
      }`}
    >
      <div
        {...dragHandleProps}
        className="flex flex-col items-center justify-center bg-orange-50 rounded-xl px-3 py-2 h-fit min-h-11 min-w-11"
      >
        <span className="text-primary font-bold text-lg">{sequence}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2 mb-1">
          <div className="min-w-0">
            {place.time ? (
              <p className="flex items-center gap-1 text-xs font-bold text-secondary mb-0.5">
                <Clock size={12} />
                {place.time}
              </p>
            ) : null}
            <h3 className="text-lg font-bold text-gray-800 truncate">{place.placeName}</h3>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(place.id);
            }}
            className="text-gray-300 hover:text-red-400 transition-colors shrink-0"
            aria-label={`${place.placeName} 삭제`}
          >
            <Trash2 size={18} />
          </button>
        </div>

        {place.memo ? <p className="text-gray-600 text-sm mb-2 leading-relaxed whitespace-pre-wrap">{place.memo}</p> : null}

        {place.kakaoMapUrl ? (
          <a
            href={place.kakaoMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs font-bold text-secondary hover:underline"
          >
            <ExternalLink size={12} /> 카카오맵에서 열기
          </a>
        ) : null}
      </div>
    </motion.div>
  );
}

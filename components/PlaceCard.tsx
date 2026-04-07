'use client';

import { Trash2, ExternalLink, Clock, Navigation } from 'lucide-react';
import { motion } from 'motion/react';
import type { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import type { Place } from '../lib/types';

interface PlaceCardProps {
  place: Place;
  onDelete: (id: string) => void;
  onClick?: (id: string) => void;
  onToggleSelect?: (id: string) => void;
  isSelected?: boolean;
  isActive?: boolean;
  suitabilityScore?: number;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
}

export default function PlaceCard({
  place,
  onDelete,
  onClick,
  onToggleSelect,
  isSelected = false,
  isActive = false,
  suitabilityScore,
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
      } ${isSelected ? 'bg-orange-50/40' : ''}`}
    >
      <div 
        {...dragHandleProps}
        className="flex flex-col items-center justify-center bg-orange-50 rounded-xl px-3 py-2 h-fit min-h-11 min-w-11"
      >
        <span className="text-primary font-bold text-lg">{place.order + 1}</span>
      </div>

      <div className="flex-1">
        <div className="flex justify-between items-start mb-1">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isSelected}
              onClick={(e) => e.stopPropagation()}
              onChange={() => onToggleSelect?.(place.id)}
              aria-label={`${place.name} 선택`}
              className="h-4 w-4"
            />
            <h3 className="text-lg font-bold text-gray-800">{place.name}</h3>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(place.id);
            }}
            className="text-gray-300 hover:text-red-400 transition-colors"
            aria-label={`${place.name} 삭제`}
          >
            <Trash2 size={18} />
          </button>
        </div>

        {place.memo && (
          <p className="text-gray-600 text-sm mb-2 leading-relaxed">{place.memo}</p>
        )}

        {place.tags && place.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {place.tags.map((tag, i) => (
              <span 
                key={i} 
                className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-secondary border border-blue-100"
              >
                {tag}
              </span>
            ))}
            {typeof suitabilityScore === 'number' && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                가족 적합도 {suitabilityScore}점
              </span>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
          {place.cost !== undefined && (
            <div className="flex items-center gap-1 font-medium text-orange-500">
              <span>₩ {place.cost.toLocaleString()}</span>
            </div>
          )}
          {place.actualCost !== undefined && (
            <div className="flex items-center gap-1 font-medium text-red-400">
              <span>실제 ₩ {place.actualCost.toLocaleString()}</span>
            </div>
          )}
          
          {place.routeNote?.estimatedTime && (
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>{place.routeNote.estimatedTime}</span>
            </div>
          )}

          {place.routeNote?.distance && (
            <div className="flex items-center gap-1">
              <Navigation size={12} />
              <span>{place.routeNote.distance}</span>
            </div>
          )}
        </div>

        {place.checklist && place.checklist.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            체크리스트: {place.checklist.join(', ')}
          </div>
        )}
        {place.sharedNote && (
          <div className="mt-1 text-xs text-purple-500 font-medium">
            가족 메모: {place.sharedNote}
          </div>
        )}

        <div className="flex gap-2 mt-3">
          {place.externalLinks?.kakaoMap && (
            <a 
              href={place.externalLinks.kakaoMap} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] font-bold text-secondary hover:underline"
            >
              <ExternalLink size={10} /> 카카오맵
            </a>
          )}
          {place.externalLinks?.naverMap && (
            <a 
              href={place.externalLinks.naverMap} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] font-bold text-green-600 hover:underline"
            >
              <ExternalLink size={10} /> 네이버맵
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

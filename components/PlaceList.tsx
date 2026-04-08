'use client';

import { useRef } from 'react';
import PlaceCard from './PlaceCard';
import { deleteSchedulePlace } from '../lib/firestore-utils';
import type { SchedulePlace } from '../lib/types';

interface PlaceListProps {
  places: SchedulePlace[];
  selectedPlaceId?: string | null;
  onFocusPlace?: (placeId: string) => void;
  onEditPlace?: (place: SchedulePlace) => void;
  onSyncStatusChange?: (status: 'saved' | 'syncing' | 'offline' | 'error') => void;
}

export default function PlaceList({
  places,
  selectedPlaceId,
  onFocusPlace,
  onEditPlace,
  onSyncStatusChange,
}: PlaceListProps) {
  const listContainerRef = useRef<HTMLDivElement | null>(null);

  const handleDelete = async (placeId: string) => {
    if (!confirm('이 일정을 삭제할까요?')) return;
    onSyncStatusChange?.(navigator.onLine ? 'syncing' : 'offline');
    try {
      await deleteSchedulePlace(placeId);
      onSyncStatusChange?.('saved');
    } catch {
      onSyncStatusChange?.('error');
    }
  };

  const handleOpenPlace = (place: SchedulePlace) => {
    onFocusPlace?.(place.id);
    onEditPlace?.(place);
    const target = listContainerRef.current?.querySelector(`[data-place-id="${place.id}"]`);
    if (target instanceof HTMLElement) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="pb-28 space-y-3.5" ref={listContainerRef}>
      {places.map((place, index) => (
        <div key={place.id} data-place-id={place.id}>
          <PlaceCard
            place={place}
            sequence={index + 1}
            isActive={selectedPlaceId === place.id}
            onOpen={handleOpenPlace}
            onDelete={handleDelete}
          />
        </div>
      ))}
    </div>
  );
}

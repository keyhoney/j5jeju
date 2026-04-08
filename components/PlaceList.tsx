'use client';

import { useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import PlaceCard from './PlaceCard';
import { deleteSchedulePlace, reorderSchedulePlaces } from '../lib/firestore-utils';
import type { SchedulePlace } from '../lib/types';

interface PlaceListProps {
  places: SchedulePlace[];
  selectedPlaceId?: string | null;
  onFocusPlace?: (placeId: string) => void;
  onSyncStatusChange?: (status: 'saved' | 'syncing' | 'offline' | 'error') => void;
}

export default function PlaceList({
  places,
  selectedPlaceId,
  onFocusPlace,
  onSyncStatusChange,
}: PlaceListProps) {
  const listContainerRef = useRef<HTMLDivElement | null>(null);

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(places);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    onSyncStatusChange?.(navigator.onLine ? 'syncing' : 'offline');
    try {
      await reorderSchedulePlaces(items.map((item) => item.id));
      onSyncStatusChange?.('saved');
    } catch {
      onSyncStatusChange?.('error');
    }
  };

  const handleDelete = async (placeId: string) => {
    if (confirm('이 일정을 삭제할까요?')) {
      await deleteSchedulePlace(placeId);
    }
  };

  const handleFocusPlace = (placeId: string) => {
    onFocusPlace?.(placeId);
    const target = listContainerRef.current?.querySelector(`[data-place-id="${placeId}"]`);
    if (target instanceof HTMLElement) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="pb-28" ref={listContainerRef}>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="places">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={snapshot.isDraggingOver ? 'bg-orange-50/40 rounded-2xl p-2' : ''}
            >
              {places.map((place, index) => (
                <Draggable key={place.id} draggableId={place.id} index={index}>
                  {(provided, dragSnapshot) => (
                    <div
                      data-place-id={place.id}
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={dragSnapshot.isDragging ? 'opacity-80 scale-[1.01]' : ''}
                    >
                      <PlaceCard
                        place={place}
                        isActive={selectedPlaceId === place.id}
                        onClick={handleFocusPlace}
                        onDelete={handleDelete}
                        dragHandleProps={provided.dragHandleProps}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}

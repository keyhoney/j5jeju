'use client';

import { useMemo, useRef, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import PlaceCard from './PlaceCard';
import { bulkDeletePlaces, bulkUpdatePlaces, reorderPlaces, deletePlace } from '../lib/firestore-utils';
import { useTripStore } from '../lib/store';
import type { Place } from '../lib/types';

interface PlaceListProps {
  places: Place[];
  selectedPlaceId?: string | null;
  onFocusPlace?: (placeId: string) => void;
  onSyncStatusChange?: (status: 'saved' | 'syncing' | 'offline' | 'error') => void;
  tripBudget?: number;
}

const PROFILE_FILTERS = [
  { label: '아이 동반', tag: '#아이취향' },
  { label: '어르신 동반', tag: '#어르신입맛' },
  { label: '이동약자', tag: '#휠체어대여' },
  { label: '휴식 우선', tag: '#휴식필수' },
];

export default function PlaceList({
  places,
  selectedPlaceId,
  onFocusPlace,
  onSyncStatusChange,
  tripBudget = 0,
}: PlaceListProps) {
  const { currentTripId, currentDayId } = useTripStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [costMode, setCostMode] = useState<'estimated' | 'actual'>('estimated');
  const [undoStack, setUndoStack] = useState<string[][]>([]);
  const [redoStack, setRedoStack] = useState<string[][]>([]);
  const listContainerRef = useRef<HTMLDivElement | null>(null);

  const filteredPlaces = useMemo(() => {
    if (!activeFilter) return places;
    return places.filter((place) => place.tags?.includes(activeFilter));
  }, [activeFilter, places]);

  const pushUndo = (orderIds: string[]) => {
    setUndoStack((prev) => [...prev.slice(-4), orderIds]);
    setRedoStack([]);
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination || !currentTripId || !currentDayId) return;
    if (activeFilter) {
      alert('필터 해제 후 순서를 변경해주세요.');
      return;
    }

    const items = Array.from(places);
    pushUndo(items.map((item) => item.id));
    onSyncStatusChange?.(navigator.onLine ? 'syncing' : 'offline');
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    try {
      await reorderPlaces(currentTripId, currentDayId, items.map((item) => item.id));
      onSyncStatusChange?.('saved');
    } catch {
      onSyncStatusChange?.('error');
    }
  };

  const handleDelete = async (placeId: string) => {
    if (!currentTripId || !currentDayId) return;
    if (confirm('정말 삭제하시겠습니까?')) {
      await deletePlace(currentTripId, currentDayId, placeId);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleBulkUpdateCost = async () => {
    if (!currentTripId || !currentDayId || selectedIds.length === 0) return;
    const value = prompt('선택한 장소에 적용할 예상 비용을 입력하세요');
    if (value === null) return;
    const cost = Number(value);
    if (Number.isNaN(cost) || cost < 0) return;
    onSyncStatusChange?.(navigator.onLine ? 'syncing' : 'offline');
    await bulkUpdatePlaces(currentTripId, currentDayId, selectedIds, { cost });
    onSyncStatusChange?.('saved');
  };

  const handleBulkDelete = async () => {
    if (!currentTripId || !currentDayId || selectedIds.length === 0) return;
    if (!confirm(`${selectedIds.length}개 장소를 삭제할까요?`)) return;
    onSyncStatusChange?.(navigator.onLine ? 'syncing' : 'offline');
    await bulkDeletePlaces(currentTripId, currentDayId, selectedIds);
    setSelectedIds([]);
    onSyncStatusChange?.('saved');
  };

  const handleRecommendRoute = async () => {
    if (!currentTripId || !currentDayId || places.length < 3) return;
    pushUndo(places.map((p) => p.id));
    const remaining = [...places];
    const recommended: Place[] = [remaining.shift() as Place];
    while (remaining.length) {
      const last = recommended[recommended.length - 1];
      let minIdx = 0;
      let minDistance = Number.MAX_SAFE_INTEGER;
      remaining.forEach((item, idx) => {
        const dx = last.location.lat - item.location.lat;
        const dy = last.location.lng - item.location.lng;
        const score = dx * dx + dy * dy;
        if (score < minDistance) {
          minDistance = score;
          minIdx = idx;
        }
      });
      recommended.push(remaining.splice(minIdx, 1)[0]);
    }
    onSyncStatusChange?.('syncing');
    await reorderPlaces(currentTripId, currentDayId, recommended.map((item) => item.id));
    onSyncStatusChange?.('saved');
  };

  const handleUndo = async () => {
    if (!currentTripId || !currentDayId || undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, places.map((item) => item.id)]);
    await reorderPlaces(currentTripId, currentDayId, previous);
  };

  const handleRedo = async () => {
    if (!currentTripId || !currentDayId || redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, places.map((item) => item.id)]);
    await reorderPlaces(currentTripId, currentDayId, next);
  };

  const totalEstimated = places.reduce((sum, p) => sum + (p.cost || 0), 0);
  const totalActual = places.reduce((sum, p) => sum + (p.actualCost || 0), 0);
  const totalCost = costMode === 'estimated' ? totalEstimated : totalActual;
  const dayBudget = 200000;
  const dayRate = Math.min(100, Math.round((totalCost / dayBudget) * 100));
  const tripRate = tripBudget > 0 ? Math.min(100, Math.round((totalCost / tripBudget) * 100)) : 0;
  const categorySummary = places.reduce<Record<string, number>>((acc, place) => {
    const key = place.category || 'etc';
    const value = costMode === 'estimated' ? place.cost || 0 : place.actualCost || 0;
    acc[key] = (acc[key] || 0) + value;
    return acc;
  }, {});

  const handleFocusPlace = (placeId: string) => {
    onFocusPlace?.(placeId);
    const target = listContainerRef.current?.querySelector(`[data-place-id="${placeId}"]`);
    if (target instanceof HTMLElement) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="pb-24" ref={listContainerRef}>
      <div className="mb-3 flex flex-wrap gap-2">
        {PROFILE_FILTERS.map((filter) => (
          <button
            key={filter.tag}
            onClick={() => setActiveFilter((prev) => (prev === filter.tag ? null : filter.tag))}
            className={`px-3 py-2 rounded-full text-xs border min-h-11 ${activeFilter === filter.tag ? 'bg-primary text-white border-primary' : 'bg-white border-gray-200 text-gray-500'}`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <button onClick={handleUndo} disabled={undoStack.length === 0} className="px-3 py-2 rounded-lg text-xs bg-white border border-gray-200 disabled:opacity-40 min-h-11">실행 취소</button>
        <button onClick={handleRedo} disabled={redoStack.length === 0} className="px-3 py-2 rounded-lg text-xs bg-white border border-gray-200 disabled:opacity-40 min-h-11">다시 실행</button>
        <button onClick={handleRecommendRoute} className="px-3 py-2 rounded-lg text-xs bg-blue-50 text-secondary border border-blue-100 min-h-11">동선 추천 정렬</button>
        <button onClick={handleBulkUpdateCost} disabled={selectedIds.length === 0} className="px-3 py-2 rounded-lg text-xs bg-white border border-gray-200 disabled:opacity-40 min-h-11">선택 비용 일괄적용</button>
        <button onClick={handleBulkDelete} disabled={selectedIds.length === 0} className="px-3 py-2 rounded-lg text-xs bg-red-50 text-red-500 border border-red-100 disabled:opacity-40 min-h-11">선택 삭제</button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="places">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={snapshot.isDraggingOver ? 'bg-orange-50/40 rounded-2xl p-2' : ''}
            >
              {filteredPlaces.map((place, index) => (
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
                        isSelected={selectedIds.includes(place.id)}
                        isActive={selectedPlaceId === place.id}
                        suitabilityScore={PROFILE_FILTERS.reduce((score, item) => score + (place.tags?.includes(item.tag) ? 25 : 0), 0)}
                        onClick={handleFocusPlace}
                        onToggleSelect={toggleSelect}
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

      {/* Sticky Budget Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-orange-100 shadow-lg z-40">
        <div className="max-w-md mx-auto space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 font-medium">오늘의 총 비용</span>
              <button onClick={() => setCostMode((prev) => (prev === 'estimated' ? 'actual' : 'estimated'))} className="text-[11px] px-2 py-1 rounded-full bg-gray-100 min-h-8">
                {costMode === 'estimated' ? '예상' : '실제'}
              </button>
            </div>
            <span className="text-xl font-bold text-primary">₩ {totalCost.toLocaleString()}</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Day 예산 진행률</span><span>{dayRate}%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100">
              <div className={`h-2 rounded-full ${dayRate > 100 ? 'bg-red-400' : 'bg-primary'}`} style={{ width: `${Math.min(dayRate, 100)}%` }} />
            </div>
            {tripBudget > 0 && (
              <>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Trip 예산 진행률</span><span>{tripRate}%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div className="h-2 rounded-full bg-secondary" style={{ width: `${tripRate}%` }} />
                </div>
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] text-gray-500">
            {Object.entries(categorySummary).map(([key, value]) => (
              <span key={key} className="px-2 py-1 rounded-full bg-gray-100">
                {key}: ₩{value.toLocaleString()}
              </span>
            ))}
          </div>
          {totalCost > dayBudget && (
            <p className="text-xs text-red-500">Day 예산을 초과했습니다. 카페/기타 코스 조정 또는 무료 코스 대체를 권장합니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}

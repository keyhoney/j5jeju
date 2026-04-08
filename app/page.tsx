'use client';

import { useEffect, useState } from 'react';
import DayTabs from '../components/DayTabs';
import KakaoMap from '../components/KakaoMap';
import PlaceList from '../components/PlaceList';
import AddPlaceModal from '../components/AddPlaceModal';
import { subscribeSchedulePlaces, testConnection } from '../lib/firestore-utils';
import { useTripStore } from '../lib/store';
import type { SchedulePlace } from '../lib/types';
import { FIXED_TRIP_TITLE } from '../lib/constants';
import { Plus, Map as MapIcon, Wifi, WifiOff, Contrast, Type } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Home() {
  const [places, setPlaces] = useState<SchedulePlace[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<SchedulePlace | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isHeaderCompact, setIsHeaderCompact] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [syncLabel, setSyncLabel] = useState('저장됨');
  const {
    currentDayIndex,
    selectedPlaceId,
    setSelectedPlaceId,
    syncStatus,
    setSyncStatus,
    fontScale,
    highContrast,
    toggleFontScale,
    toggleHighContrast,
  } = useTripStore();

  useEffect(() => {
    testConnection();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updateStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      if (!online) setSyncStatus('offline');
      if (online && syncStatus === 'offline') setSyncStatus('saved');
    };
    updateStatus();
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, [setSyncStatus, syncStatus]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onScroll = () => setIsHeaderCompact(window.scrollY >= 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('text-large', fontScale === 'large');
    document.body.classList.toggle('high-contrast', highContrast);
  }, [fontScale, highContrast]);

  useEffect(() => {
    const unsubscribe = subscribeSchedulePlaces(currentDayIndex, (fetched) => {
      setPlaces(fetched);
      setSyncStatus('saved');
    });
    return () => unsubscribe();
  }, [currentDayIndex, setSyncStatus]);

  useEffect(() => {
    if (syncStatus === 'saved') {
      setLastSavedAt(Date.now());
    }
  }, [syncStatus]);

  useEffect(() => {
    const formatSyncLabel = () => {
      if (syncStatus === 'syncing') return '동기화 중';
      if (syncStatus === 'offline') return '오프라인';
      if (syncStatus === 'error') return '오류';
      if (!lastSavedAt) return '저장됨';
      const mins = Math.max(0, Math.floor((Date.now() - lastSavedAt) / 60000));
      return mins <= 0 ? '저장됨 · 방금 전' : `저장됨 · ${mins}분 전`;
    };
    setSyncLabel(formatSyncLabel());
    const timer = window.setInterval(() => setSyncLabel(formatSyncLabel()), 30000);
    return () => window.clearInterval(timer);
  }, [syncStatus, lastSavedAt]);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPlace(null);
  };

  const openAddModal = () => {
    setEditingPlace(null);
    setIsModalOpen(true);
  };

  const existingNamesForModal = places
    .filter((p) => !editingPlace || p.id !== editingPlace.id)
    .map((p) => p.placeName);

  return (
    <main className="min-h-screen bg-background pb-20">
      <header
        className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-transparent transition-all"
        style={{
          height: isHeaderCompact ? '64px' : '88px',
          transitionDuration: '160ms',
        }}
      >
        <div className="h-full px-4 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-primary flex items-center gap-2 leading-none">
              <MapIcon size={24} className="shrink-0" /> JEJU
            </h1>
            <p className="text-xs text-gray-500 mt-1 truncate">
              {FIXED_TRIP_TITLE} · 4/13 ~ 4/16
              <span className="mx-1">·</span>
              <span className="inline-flex items-center gap-1 font-bold text-gray-500">
                {isOnline ? <Wifi size={12} className="text-green-500" /> : <WifiOff size={12} className="text-red-400" />}
                {syncLabel}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFontScale}
              className="rounded-full bg-white shadow-sm min-h-11 min-w-11 flex items-center justify-center"
              aria-label="글자 크기 전환"
            >
              <Type size={14} />
            </button>
            <button
              onClick={toggleHighContrast}
              className="rounded-full bg-white shadow-sm min-h-11 min-w-11 flex items-center justify-center"
              aria-label="고대비 전환"
            >
              <Contrast size={14} />
            </button>
          </div>
        </div>
      </header>

      <div className="container max-w-md mx-auto px-4">
        <DayTabs />

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <KakaoMap places={places} selectedPlaceId={selectedPlaceId} onSelectPlace={setSelectedPlaceId} />

          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                일정 <span className="text-sm font-normal text-gray-400">({places.length})</span>
              </h2>
            </div>

            {places.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-100">
                <p className="text-gray-400 mb-4">
                  아직 일정이 없습니다.
                  <br />
                  시간·장소·메모를 추가해 보세요.
                </p>
                <button
                  type="button"
                  onClick={openAddModal}
                  className="px-6 py-3 bg-primary text-white font-bold rounded-2xl shadow-sm"
                >
                  일정 추가
                </button>
              </div>
            ) : (
              <PlaceList
                places={places}
                selectedPlaceId={selectedPlaceId}
                onFocusPlace={setSelectedPlaceId}
                onEditPlace={(place) => {
                  setEditingPlace(place);
                  setIsModalOpen(true);
                }}
                onSyncStatusChange={setSyncStatus}
              />
            )}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={openAddModal}
          className="fixed bottom-8 right-6 z-50 w-16 h-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-orange-400 transition-colors"
          aria-label="일정 추가"
        >
          <Plus size={32} />
        </motion.button>
      </AnimatePresence>

      <AddPlaceModal
        isOpen={isModalOpen}
        onClose={closeModal}
        editingPlace={editingPlace}
        existingPlaceNames={existingNamesForModal}
      />
    </main>
  );
}

'use client';

import { useEffect, useState } from 'react';
import DayTabs from '../components/DayTabs';
import WeatherShortcuts from '../components/WeatherShortcuts';
import KakaoMap from '../components/KakaoMap';
import PlaceList from '../components/PlaceList';
import AddPlaceModal from '../components/AddPlaceModal';
import { subscribeSchedulePlaces, testConnection } from '../lib/firestore-utils';
import { useTripStore } from '../lib/store';
import type { SchedulePlace } from '../lib/types';
import { FIXED_TRIP_TITLE } from '../lib/constants';
import { Plus, Map as MapIcon, Calendar, Wifi, WifiOff, Contrast, Type } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Home() {
  const [places, setPlaces] = useState<SchedulePlace[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<SchedulePlace | null>(null);
  const [isOnline, setIsOnline] = useState(true);
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
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md p-4 flex justify-between items-center gap-2 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-primary flex items-center gap-2">
            <MapIcon size={26} className="shrink-0" /> JEJU
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">{FIXED_TRIP_TITLE} · 4/13 ~ 4/16</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFontScale}
            className="p-2 rounded-full bg-white shadow-sm min-h-11 min-w-11"
            aria-label="글자 크기 전환"
          >
            <Type size={14} />
          </button>
          <button
            onClick={toggleHighContrast}
            className="p-2 rounded-full bg-white shadow-sm min-h-11 min-w-11"
            aria-label="고대비 전환"
          >
            <Contrast size={14} />
          </button>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-white px-3 py-1.5 rounded-full shadow-sm">
            {isOnline ? <Wifi size={12} className="text-green-500" /> : <WifiOff size={12} className="text-red-400" />}
            <span>
              {syncStatus === 'syncing'
                ? '동기화 중'
                : syncStatus === 'saved'
                  ? '저장됨'
                  : syncStatus === 'offline'
                    ? '오프라인'
                    : '오류'}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-gray-400 bg-white px-3 py-1.5 rounded-full shadow-sm">
            <Calendar size={14} /> {new Date().toLocaleDateString('ko-KR')}
          </div>
        </div>
      </header>

      <div className="container max-w-md mx-auto px-4">
        <DayTabs />

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <WeatherShortcuts />
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

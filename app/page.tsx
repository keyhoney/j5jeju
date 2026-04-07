'use client';

import { useEffect, useState } from 'react';
import { signInAnonymously, onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import TripSelector from '../components/TripSelector';
import DaySelector from '../components/DaySelector';
import KakaoMap from '../components/KakaoMap';
import PlaceList from '../components/PlaceList';
import AddPlaceModal from '../components/AddPlaceModal';
import { subscribePlaces, testConnection } from '../lib/firestore-utils';
import { useTripStore } from '../lib/store';
import type { Place } from '../lib/types';
import { Plus, Map as MapIcon, Calendar, Info, Wifi, WifiOff, Contrast, Type } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tripBudget, setTripBudget] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const {
    currentTripId,
    currentDayId,
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
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setAuthError(null);
        setLoading(false);
      } else {
        signInAnonymously(auth).catch((error) => {
          console.error(error);
          setAuthError('인증 설정을 확인해주세요. (Firebase 익명 로그인 필요)');
          setLoading(false);
        });
      }
    });
    return () => unsubscribe();
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
    let unsubscribe: (() => void) | undefined;
    
    if (currentTripId && currentDayId) {
      unsubscribe = subscribePlaces(currentTripId, currentDayId, (fetchedPlaces) => {
        setPlaces(fetchedPlaces);
        setSyncStatus('saved');
        if (typeof window !== 'undefined') {
          localStorage.setItem('jeju_places_snapshot', JSON.stringify(fetchedPlaces));
        }
      });
    } else {
      // Defer to avoid synchronous setState in effect body
      Promise.resolve().then(() => setPlaces([]));
    }
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentTripId, currentDayId, setSyncStatus]);

  useEffect(() => {
    if (!currentTripId && typeof window !== 'undefined') {
      const snapshot = localStorage.getItem('jeju_places_snapshot');
      if (snapshot) {
        try {
          const parsed = JSON.parse(snapshot) as Place[];
          if (parsed.length > 0) {
            Promise.resolve().then(() => setPlaces(parsed));
          }
        } catch {
          // ignore
        }
      }
    }
  }, [currentTripId]);

  useEffect(() => {
    if (!currentTripId) return;
    const raw = window.localStorage.getItem(`jeju_trip_budget_${currentTripId}`);
    Promise.resolve().then(() => setTripBudget(raw ? Number(raw) : 0));
  }, [currentTripId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mb-4"
        />
        <p className="text-primary font-bold animate-pulse">제주 여행 준비 중...</p>
      </div>
    );
  }

  if (authError) {
    return (
      <main className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="max-w-md bg-white rounded-2xl border border-red-100 p-6 text-center shadow-jeju">
          <p className="text-red-500 font-bold mb-2">인증 오류</p>
          <p className="text-sm text-gray-600 leading-relaxed">{authError}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md p-4 flex justify-between items-center">
        <h1 className="text-2xl font-black text-primary flex items-center gap-2">
          <MapIcon size={28} /> JEJU PLAN
        </h1>
        <div className="flex items-center gap-2">
          <button onClick={toggleFontScale} className="p-2 rounded-full bg-white shadow-sm min-h-11 min-w-11" aria-label="글자 크기 전환">
            <Type size={14} />
          </button>
          <button onClick={toggleHighContrast} className="p-2 rounded-full bg-white shadow-sm min-h-11 min-w-11" aria-label="고대비 전환">
            <Contrast size={14} />
          </button>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-white px-3 py-1.5 rounded-full shadow-sm">
            {isOnline ? <Wifi size={12} className="text-green-500" /> : <WifiOff size={12} className="text-red-400" />}
            <span>{syncStatus === 'syncing' ? '동기화 중' : syncStatus === 'saved' ? '저장됨' : syncStatus === 'offline' ? '오프라인' : '오류'}</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-white px-3 py-1.5 rounded-full shadow-sm">
          <Calendar size={14} /> {new Date().toLocaleDateString('ko-KR')}
          </div>
        </div>
      </header>

      <div className="container max-w-md mx-auto px-4">
        {/* Trip Selection */}
        <TripSelector user={user} />

        {currentTripId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Day Selection */}
            <DaySelector />

            {/* Map View */}
            <KakaoMap places={places} selectedPlaceId={selectedPlaceId} onSelectPlace={setSelectedPlaceId} />

            {/* Place List */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  오늘의 일정 <span className="text-sm font-normal text-gray-400">({places.length})</span>
                </h2>
                <div className="p-1.5 bg-blue-50 text-secondary rounded-lg">
                  <Info size={16} />
                </div>
              </div>

              {places.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-100">
                  <p className="text-gray-400 mb-4">아직 일정이 없습니다.<br/>가족과 함께할 장소를 추가해보세요!</p>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="px-6 py-3 bg-primary text-white font-bold rounded-2xl shadow-sm"
                  >
                    첫 장소 추가하기
                  </button>
                </div>
              ) : (
                <PlaceList
                  places={places}
                  tripBudget={tripBudget}
                  selectedPlaceId={selectedPlaceId}
                  onFocusPlace={setSelectedPlaceId}
                  onSyncStatusChange={setSyncStatus}
                />
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Floating Action Button */}
      <AnimatePresence>
        {currentDayId && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsModalOpen(true)}
            className="fixed bottom-24 right-6 z-50 w-16 h-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-orange-400 transition-colors"
          >
            <Plus size={32} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Add Place Modal */}
      <AddPlaceModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        nextOrder={places.length}
        existingPlaces={places.map((place) => place.name)}
      />
    </main>
  );
}

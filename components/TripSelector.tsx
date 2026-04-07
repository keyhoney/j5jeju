'use client';

import { useEffect, useState } from 'react';
import { subscribeTrips, createTrip, getDaysCol } from '../lib/firestore-utils';
import { useTripStore } from '../lib/store';
import { Plus, Map as MapIcon } from 'lucide-react';
import { addDoc } from 'firebase/firestore';
import { format, addDays } from 'date-fns';
import type { User } from 'firebase/auth';
import type { NewTrip, Trip } from '../lib/types';

interface TripSelectorProps {
  user: User | null;
}

export default function TripSelector({ user }: TripSelectorProps) {
  const { currentTripId, setCurrentTrip } = useTripStore();
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubscribe = subscribeTrips(user.uid, (fetchedTrips) => {
      setTrips(fetchedTrips);
      if (fetchedTrips.length > 0 && !currentTripId) {
        setCurrentTrip(fetchedTrips[0].id);
      }
    });
    return () => unsubscribe();
  }, [currentTripId, setCurrentTrip, user]);

  const handleCreateTrip = async () => {
    if (!user) return;

    const title = prompt('여행 제목을 입력하세요 (예: 2024 제주 가족여행)');
    if (!title) return;

    const newTrip: NewTrip = {
      title,
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
      totalBudget: 0,
      ownerId: user.uid,
    };

    const docRef = await createTrip(newTrip);
    if (docRef) {
      // Create initial 3 days
      const daysCol = getDaysCol(docRef.id);
      for (let i = 1; i <= 3; i++) {
        await addDoc(daysCol, {
          dayNumber: i,
          date: format(addDays(new Date(), i - 1), 'yyyy-MM-dd'),
        });
      }
      localStorage.setItem(`jeju_trip_budget_${docRef.id}`, '0');
      setCurrentTrip(docRef.id);
    }
  };

  const handleSetBudget = () => {
    if (!currentTripId) return;
    const raw = prompt('여행 총 예산(원)을 입력하세요', localStorage.getItem(`jeju_trip_budget_${currentTripId}`) || '0');
    if (raw === null) return;
    const budget = Number(raw);
    if (Number.isNaN(budget) || budget < 0) return;
    localStorage.setItem(`jeju_trip_budget_${currentTripId}`, String(budget));
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-jeju mb-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-100 rounded-xl text-primary">
          <MapIcon size={24} />
        </div>
        <div>
          <select 
            value={currentTripId || ''} 
            onChange={(e) => setCurrentTrip(e.target.value)}
            className="font-bold text-lg bg-transparent border-none focus:ring-0 p-0 pr-8"
          >
            {trips.length === 0 && <option value="">여행을 생성해주세요</option>}
            {trips.map(trip => (
              <option key={trip.id} value={trip.id}>{trip.title}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400">가족과 함께하는 제주 여행</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={handleSetBudget} className="px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl min-h-11">
          예산
        </button>
        <button 
          onClick={handleCreateTrip}
          className="p-2 bg-primary text-white rounded-xl shadow-sm hover:bg-orange-400 transition-colors min-h-11 min-w-11"
          aria-label="여행 생성"
        >
          <Plus size={20} />
        </button>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { subscribeDays } from '../lib/firestore-utils';
import { useTripStore } from '../lib/store';
import { motion } from 'motion/react';
import type { Day } from '../lib/types';

export default function DaySelector() {
  const { currentTripId, currentDayId, setCurrentDay } = useTripStore();
  const [days, setDays] = useState<Day[]>([]);

  useEffect(() => {
    if (!currentTripId) return;
    const unsubscribe = subscribeDays(currentTripId, (fetchedDays) => {
      setDays(fetchedDays);
      if (fetchedDays.length > 0 && !currentDayId) {
        setCurrentDay(fetchedDays[0].id, fetchedDays[0].dayNumber);
      }
    });
    return () => unsubscribe();
  }, [currentTripId, currentDayId, setCurrentDay]);

  return (
    <div className="flex gap-2 overflow-x-auto py-4 no-scrollbar">
      {days.map((day) => (
        <motion.button
          key={day.id}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCurrentDay(day.id, day.dayNumber)}
          className={`flex-shrink-0 px-6 py-2 rounded-full font-bold text-sm transition-all shadow-sm ${
            currentDayId === day.id
              ? 'bg-primary text-white shadow-orange-200'
              : 'bg-white text-gray-400 border border-gray-100'
          }`}
        >
          Day {day.dayNumber}
        </motion.button>
      ))}
    </div>
  );
}

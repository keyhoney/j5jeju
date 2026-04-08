'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { FIXED_DAYS } from '../lib/constants';
import { subscribeSchedulePlaces } from '../lib/firestore-utils';
import { useTripStore } from '../lib/store';

export default function DayTabs() {
  const { currentDayIndex, setCurrentDayIndex } = useTripStore();
  const [dayCounts, setDayCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    const unsubscribers = FIXED_DAYS.map((day) =>
      subscribeSchedulePlaces(day.index, (places) => {
        setDayCounts((prev) => ({ ...prev, [day.index]: places.length }));
      })
    );
    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-6 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-6 bg-gradient-to-l from-background to-transparent" />
      <div className="flex gap-2 overflow-x-auto py-4 no-scrollbar">
        {FIXED_DAYS.map((day) => (
          <motion.button
            key={day.index}
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentDayIndex(day.index)}
            className={`flex-shrink-0 px-4 py-2.5 rounded-full text-sm transition-all duration-150 min-h-11 border ${
              currentDayIndex === day.index
                ? 'bg-primary text-white border-primary shadow-md shadow-orange-200/70'
                : 'bg-white text-gray-700 border-gray-200'
            }`}
          >
            <span className="block text-[11px] font-semibold leading-tight opacity-90">{day.dateLabel}</span>
            <span className="mt-1 inline-flex items-center gap-1.5 leading-none">
              <span className="font-extrabold tracking-tight">{day.title}</span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  currentDayIndex === day.index ? 'bg-white/20 text-white' : 'bg-orange-50 text-secondary'
                }`}
              >
                {dayCounts[day.index] ?? 0}곳
              </span>
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

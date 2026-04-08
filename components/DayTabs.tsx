'use client';

import { motion } from 'motion/react';
import { FIXED_DAYS } from '../lib/constants';
import { useTripStore } from '../lib/store';

export default function DayTabs() {
  const { currentDayIndex, setCurrentDayIndex } = useTripStore();

  return (
    <div className="flex gap-2 overflow-x-auto py-4 no-scrollbar">
      {FIXED_DAYS.map((day) => (
        <motion.button
          key={day.index}
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={() => setCurrentDayIndex(day.index)}
          className={`flex-shrink-0 px-4 py-2 rounded-full font-bold text-sm transition-all shadow-sm min-h-11 ${
            currentDayIndex === day.index
              ? 'bg-primary text-white shadow-orange-200'
              : 'bg-white text-gray-500 border border-gray-100'
          }`}
        >
          <span className="block">{day.dateLabel}</span>
          <span className="block text-[11px] font-medium opacity-90">{day.title}</span>
        </motion.button>
      ))}
    </div>
  );
}

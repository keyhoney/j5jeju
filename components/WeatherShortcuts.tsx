'use client';

import { Cloud } from 'lucide-react';
import { WEATHER_SHORTCUTS } from '../lib/weather-shortcuts';

export default function WeatherShortcuts() {
  return (
    <section
      aria-label="지역별 날씨 바로가기"
      className="bg-white rounded-3xl p-4 shadow-jeju border border-orange-50"
    >
      <h2 className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
        <Cloud size={18} className="text-primary shrink-0" aria-hidden />
        지역 날씨
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {WEATHER_SHORTCUTS.map(({ label, href }) => (
          <a
            key={href}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center min-h-11 px-2 rounded-xl bg-orange-50/80 border border-orange-100 text-sm font-bold text-gray-800 hover:bg-orange-100 hover:border-primary/30 transition-colors text-center"
          >
            {label}
          </a>
        ))}
      </div>
    </section>
  );
}

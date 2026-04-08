'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, MapPin, FileText, Search, Clock, Link2 } from 'lucide-react';
import { deleteField } from 'firebase/firestore';
import { addSchedulePlace, updateSchedulePlace } from '../lib/firestore-utils';
import { useTripStore } from '../lib/store';
import { motion, AnimatePresence } from 'motion/react';
import type { NewSchedulePlace, SchedulePlace } from '../lib/types';
import { buildKakaoMapLinkFromCoords, parseLatLngFromKakaoUrl } from '../lib/kakao-url';
import { parseHHMM } from '../lib/schedule-sort';

interface AddPlaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** null이면 추가, 있으면 해당 일정 수정 */
  editingPlace: SchedulePlace | null;
  existingPlaceNames: string[];
}

const LOCAL_SEARCH_KEY = 'jeju_recent_searches_simple';

export default function AddPlaceModal({
  isOpen,
  onClose,
  editingPlace,
  existingPlaceNames,
}: AddPlaceModalProps) {
  const { currentDayIndex } = useTripStore();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{ name: string; lat: number; lng: number }[]>([]);
  const [searching, setSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [error, setError] = useState('');
  /** type="time" 값 (HH:mm) */
  const [time, setTime] = useState('');
  const [noTime, setNoTime] = useState(false);
  const [placeName, setPlaceName] = useState('');
  const [kakaoMapUrl, setKakaoMapUrl] = useState('');
  const [memo, setMemo] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  const isDuplicate = useMemo(
    () => existingPlaceNames.some((p) => p.trim().toLowerCase() === placeName.trim().toLowerCase()),
    [existingPlaceNames, placeName]
  );

  useEffect(() => {
    if (!isOpen) return;
    if (editingPlace) {
      const parsed = parseHHMM(editingPlace.time);
      if (parsed) {
        setTime(parsed);
        setNoTime(false);
      } else {
        setTime('');
        setNoTime(true);
      }
      setPlaceName(editingPlace.placeName);
      setKakaoMapUrl(editingPlace.kakaoMapUrl ?? '');
      setMemo(editingPlace.memo ?? '');
      setLat(String(editingPlace.lat));
      setLng(String(editingPlace.lng));
      setQuery('');
      setSuggestions([]);
      setError('');
      return;
    }
    resetFormInner();
  }, [isOpen, editingPlace?.id]);

  function resetFormInner() {
    setQuery('');
    setSuggestions([]);
    setError('');
    setTime('');
    setNoTime(false);
    setPlaceName('');
    setKakaoMapUrl('');
    setMemo('');
    setLat('');
    setLng('');
  }

  useEffect(() => {
    if (!isOpen) return;
    try {
      const stored = JSON.parse(localStorage.getItem(LOCAL_SEARCH_KEY) || '[]');
      Promise.resolve().then(() => setRecentSearches(Array.isArray(stored) ? stored : []));
    } catch {
      Promise.resolve().then(() => setRecentSearches([]));
    }
  }, [isOpen]);

  const saveRecentSearch = (keyword: string) => {
    const normalized = keyword.trim();
    if (!normalized) return;
    const next = [normalized, ...recentSearches.filter((item) => item !== normalized)].slice(0, 8);
    setRecentSearches(next);
    localStorage.setItem(LOCAL_SEARCH_KEY, JSON.stringify(next));
  };

  const applyCoords = (la: number, ln: number, name: string, url?: string) => {
    setLat(String(la));
    setLng(String(ln));
    setPlaceName(name);
    setKakaoMapUrl(url ?? buildKakaoMapLinkFromCoords(la, ln, name));
    setSuggestions([]);
  };

  const handleSearch = () => {
    const keyword = query.trim();
    if (!keyword || typeof window === 'undefined' || !window.kakao?.maps?.services) return;
    setSearching(true);
    setError('');
    const places = new window.kakao.maps.services.Places();
    places.keywordSearch(keyword, (result, status) => {
      setSearching(false);
      if (status !== window.kakao.maps.services.Status.OK || !result.length) {
        setSuggestions([]);
        return;
      }
      setSuggestions(
        result.slice(0, 6).map((item) => ({
          name: item.place_name,
          lat: Number(item.y),
          lng: Number(item.x),
        }))
      );
      saveRecentSearch(keyword);
    });
  };

  const applySuggestion = (place: { name: string; lat: number; lng: number }) => {
    applyCoords(place.lat, place.lng, place.name);
  };

  useEffect(() => {
    if (!kakaoMapUrl.trim()) return;
    const parsed = parseLatLngFromKakaoUrl(kakaoMapUrl);
    if (parsed) {
      setLat(String(parsed.lat));
      setLng(String(parsed.lng));
    }
  }, [kakaoMapUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placeName.trim()) return setError('장소 이름을 입력해 주세요.');
    if (!noTime && !time) return setError('시간을 선택하거나, 「시간 없음」을 체크해 주세요.');
    if (isDuplicate) return setError('같은 이름의 장소가 이미 있습니다.');
    const la = Number(lat);
    const ln = Number(lng);
    if (!Number.isFinite(la) || !Number.isFinite(ln)) {
      return setError('지도에 표시하려면 장소 검색으로 선택하거나, 좌표가 들어 있는 카카오맵 링크를 붙여 넣어 주세요.');
    }

    let url = kakaoMapUrl.trim();
    if (!url) {
      url = buildKakaoMapLinkFromCoords(la, ln, placeName.trim());
    }

    const timeStored = noTime ? '' : parseHHMM(time) ?? time.trim();

    if (editingPlace) {
      await updateSchedulePlace(editingPlace.id, {
        time: timeStored,
        placeName: placeName.trim(),
        kakaoMapUrl: url,
        lat: la,
        lng: ln,
        ...(memo.trim() ? { memo: memo.trim() } : { memo: deleteField() }),
      });
    } else {
      const row: NewSchedulePlace = {
        dayIndex: currentDayIndex,
        time: timeStored,
        placeName: placeName.trim(),
        kakaoMapUrl: url,
        lat: la,
        lng: ln,
        ...(memo.trim() ? { memo: memo.trim() } : {}),
      };
      await addSchedulePlace(row);
    }
    resetFormInner();
    onClose();
  };

  const resetForm = () => resetFormInner();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">{editingPlace ? '일정 수정' : '일정 추가'}</h2>
              <button
                aria-label="모달 닫기"
                onClick={onClose}
                className="p-2 min-h-11 min-w-11 hover:bg-gray-100 rounded-full"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" aria-label={editingPlace ? '일정 수정 폼' : '일정 추가 폼'}>
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-1">
                  <Search size={16} /> 장소 검색 (카카오)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="예: 함덕 해수욕장"
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none min-h-11"
                  />
                  <button type="button" onClick={handleSearch} className="px-3 rounded-xl bg-secondary text-white min-h-11 shrink-0">
                    {searching ? '검색중' : '검색'}
                  </button>
                </div>
                {suggestions.length > 0 && (
                  <div className="mt-2 rounded-xl border border-gray-100 p-2 bg-gray-50 space-y-1">
                    {suggestions.map((place) => (
                      <button
                        key={`${place.name}-${place.lat}`}
                        type="button"
                        onClick={() => applySuggestion(place)}
                        className="w-full text-left text-sm py-2 px-2 rounded-lg hover:bg-white"
                      >
                        {place.name}
                      </button>
                    ))}
                  </div>
                )}
                {recentSearches.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-400 mb-1">최근 검색어</p>
                    <div className="flex flex-wrap gap-1">
                      {recentSearches.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setQuery(item)}
                          className="text-[11px] px-2 py-1 bg-white rounded-full border border-gray-200"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-1">
                  <Clock size={16} /> 시간 (24시간)
                </label>
                <label className="flex items-center gap-2 mb-2 text-sm text-gray-600 cursor-pointer min-h-11">
                  <input
                    type="checkbox"
                    checked={noTime}
                    onChange={(e) => {
                      setNoTime(e.target.checked);
                      if (e.target.checked) setTime('');
                    }}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  시간 없음 (목록 맨 아래에 표시)
                </label>
                {!noTime ? (
                  <input
                    type="time"
                    step={60}
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none min-h-11"
                  />
                ) : (
                  <p className="text-xs text-gray-400">이 일정은 시간 순 정렬 시 가장 뒤에 옵니다.</p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-1">
                  <MapPin size={16} /> 장소 이름
                </label>
                <input
                  required
                  type="text"
                  value={placeName}
                  onChange={(e) => setPlaceName(e.target.value)}
                  placeholder="예: 함덕 해수욕장"
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none min-h-11"
                />
                {isDuplicate && <p className="text-xs text-red-500 mt-1">같은 이름의 장소가 이미 있습니다.</p>}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-1">
                  <Link2 size={16} /> 카카오맵 링크 (선택)
                </label>
                <input
                  type="url"
                  value={kakaoMapUrl}
                  onChange={(e) => setKakaoMapUrl(e.target.value)}
                  placeholder="검색으로 좌표가 채워지면 자동 생성됩니다. 직접 붙여 넣어도 됩니다."
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none min-h-11 text-sm"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-1">
                  <FileText size={16} /> 메모
                </label>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="간단한 메모"
                  rows={3}
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400">위도</label>
                  <input
                    type="text"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    placeholder="검색 시 자동 입력"
                    className="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400">경도</label>
                  <input
                    type="text"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    placeholder="검색 시 자동 입력"
                    className="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                type="submit"
                className="w-full min-h-11 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-orange-100 hover:bg-orange-400 transition-all mt-4"
              >
                {editingPlace ? '저장' : '일정에 추가'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

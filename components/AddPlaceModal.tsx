'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, MapPin, Tag, DollarSign, FileText, Search, ListChecks } from 'lucide-react';
import { addPlace } from '../lib/firestore-utils';
import { useTripStore } from '../lib/store';
import { motion, AnimatePresence } from 'motion/react';
import type { NewPlace } from '../lib/types';

interface AddPlaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  nextOrder: number;
  existingPlaces: string[];
}

const COMMON_TAGS = ['#유모차가능', '#휠체어대여', '#아이취향', '#어르신입맛', '#휴식필수', '#바다뷰', '#맛집'];
const CATEGORY_LABELS = { meal: '식비', transport: '교통', ticket: '입장료', cafe: '카페', etc: '기타' } as const;
const PLACE_TEMPLATES = [
  { key: 'meal', label: '식사', tags: ['#어르신입맛', '#아이취향'], memo: '식사 시간 여유 60~90분', cost: 25000 },
  { key: 'ticket', label: '관광', tags: ['#바다뷰'], memo: '주차장/입장권 여부 확인', cost: 10000 },
  { key: 'cafe', label: '휴식', tags: ['#휴식필수'], memo: '이동 후 30분 휴식 권장', cost: 8000 },
  { key: 'etc', label: '숙소', tags: ['#유모차가능'], memo: '체크인/체크아웃 시간 메모', cost: 120000 },
] as const;
const LOCAL_SEARCH_KEY = 'jeju_recent_searches';
const LOCAL_PLACE_KEY = 'jeju_recent_places';

export default function AddPlaceModal({ isOpen, onClose, nextOrder, existingPlaces }: AddPlaceModalProps) {
  const { currentTripId, currentDayId } = useTripStore();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{ name: string; lat: number; lng: number }[]>([]);
  const [searching, setSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [recentPlaces, setRecentPlaces] = useState<{ name: string; lat: number; lng: number }[]>([]);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [memo, setMemo] = useState('');
  const [cost, setCost] = useState('');
  const [actualCost, setActualCost] = useState('');
  const [category, setCategory] = useState<NewPlace['category']>('etc');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [checklistRaw, setChecklistRaw] = useState('');
  const [sharedNote, setSharedNote] = useState('');
  const [lat, setLat] = useState('33.450701');
  const [lng, setLng] = useState('126.570667');

  const isDuplicate = useMemo(
    () => existingPlaces.some((p) => p.trim().toLowerCase() === name.trim().toLowerCase()),
    [existingPlaces, name]
  );

  useEffect(() => {
    if (!isOpen) return;
    try {
      const storedSearches = JSON.parse(localStorage.getItem(LOCAL_SEARCH_KEY) || '[]');
      const storedPlaces = JSON.parse(localStorage.getItem(LOCAL_PLACE_KEY) || '[]');
      Promise.resolve().then(() => {
        setRecentSearches(storedSearches);
        setRecentPlaces(storedPlaces);
      });
    } catch {
      Promise.resolve().then(() => {
        setRecentSearches([]);
        setRecentPlaces([]);
      });
    }
  }, [isOpen]);

  const saveRecentSearch = (keyword: string) => {
    const normalized = keyword.trim();
    if (!normalized) return;
    const next = [normalized, ...recentSearches.filter((item) => item !== normalized)].slice(0, 8);
    setRecentSearches(next);
    localStorage.setItem(LOCAL_SEARCH_KEY, JSON.stringify(next));
  };

  const saveRecentPlace = (place: { name: string; lat: number; lng: number }) => {
    const next = [place, ...recentPlaces.filter((item) => item.name !== place.name)].slice(0, 8);
    setRecentPlaces(next);
    localStorage.setItem(LOCAL_PLACE_KEY, JSON.stringify(next));
  };

  const applyTemplate = (template: (typeof PLACE_TEMPLATES)[number]) => {
    setSelectedTags((prev) => Array.from(new Set([...prev, ...template.tags])));
    setMemo((prev) => (prev ? `${prev}\n${template.memo}` : template.memo));
    setCost(String(template.cost));
    setCategory(template.key as NewPlace['category']);
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
      setSuggestions(result.slice(0, 6).map((item) => ({
        name: item.place_name,
        lat: Number(item.y),
        lng: Number(item.x),
      })));
      saveRecentSearch(keyword);
    });
  };

  const applySuggestion = (place: { name: string; lat: number; lng: number }) => {
    setName(place.name);
    setLat(String(place.lat));
    setLng(String(place.lng));
    setSuggestions([]);
    saveRecentPlace(place);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTripId || !currentDayId || !name.trim()) return;
    if (isDuplicate) return setError('같은 이름의 장소가 이미 일정에 있습니다.');
    if (Number(cost) < 0 || Number(actualCost) < 0) return setError('비용은 0 이상의 값만 입력할 수 있습니다.');

    const newPlace: NewPlace = {
      name: name.trim(),
      memo,
      cost: Number(cost) || 0,
      actualCost: Number(actualCost) || undefined,
      category,
      order: nextOrder,
      location: { lat: Number(lat), lng: Number(lng) },
      tags: selectedTags,
      checklist: checklistRaw.split(',').map((item) => item.trim()).filter(Boolean),
      sharedNote,
      externalLinks: {
        kakaoMap: `https://map.kakao.com/link/search/${encodeURIComponent(name)}`,
        naverMap: `https://map.naver.com/v5/search/${encodeURIComponent(name)}`,
      },
    };

    await addPlace(currentTripId, currentDayId, newPlace);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setQuery('');
    setSuggestions([]);
    setError('');
    setName('');
    setMemo('');
    setCost('');
    setActualCost('');
    setCategory('etc');
    setSelectedTags([]);
    setChecklistRaw('');
    setSharedNote('');
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">장소 추가하기</h2>
              <button aria-label="모달 닫기" onClick={onClose} className="p-2 min-h-11 min-w-11 hover:bg-gray-100 rounded-full">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" aria-label="장소 추가 폼">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-1"><Search size={16} /> 장소 검색</label>
                <div className="flex gap-2">
                  <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="예: 함덕 해수욕장" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none min-h-11" />
                  <button type="button" onClick={handleSearch} className="px-3 rounded-xl bg-secondary text-white min-h-11">{searching ? '검색중' : '검색'}</button>
                </div>
                {(suggestions.length > 0 || recentPlaces.length > 0 || recentSearches.length > 0) && (
                  <div className="mt-2 rounded-xl border border-gray-100 p-2 bg-gray-50 space-y-2">
                    {suggestions.length > 0 && suggestions.map((place) => (
                      <button key={`${place.name}-${place.lat}`} type="button" onClick={() => applySuggestion(place)} className="w-full text-left text-sm py-2 px-2 rounded-lg hover:bg-white">
                        {place.name}
                      </button>
                    ))}
                    {recentPlaces.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">최근 추가</p>
                        <div className="flex flex-wrap gap-1">
                          {recentPlaces.map((place) => (
                            <button key={`${place.name}-${place.lat}`} type="button" onClick={() => applySuggestion(place)} className="text-[11px] px-2 py-1 bg-white rounded-full border border-gray-200">
                              {place.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {recentSearches.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">최근 검색어</p>
                        <div className="flex flex-wrap gap-1">
                          {recentSearches.map((item) => (
                            <button key={item} type="button" onClick={() => setQuery(item)} className="text-[11px] px-2 py-1 bg-white rounded-full border border-gray-200">
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-1"><MapPin size={16} /> 장소 이름</label>
                <input required type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 함덕 해수욕장" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none min-h-11" />
                {isDuplicate && <p className="text-xs text-red-500 mt-1">같은 이름의 장소가 이미 존재합니다.</p>}
              </div>

              <div>
                <p className="text-xs font-bold text-gray-500 mb-1">빠른 템플릿</p>
                <div className="flex gap-2 flex-wrap">
                  {PLACE_TEMPLATES.map((template) => (
                    <button key={template.key} type="button" onClick={() => applyTemplate(template)} className="text-xs px-3 py-2 rounded-full bg-orange-50 border border-orange-100 text-primary min-h-11">
                      {template.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-1"><DollarSign size={16} /> 예상 비용</label>
                  <input type="number" min={0} value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none min-h-11" />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-1"><DollarSign size={16} /> 실제 비용</label>
                  <input type="number" min={0} value={actualCost} onChange={(e) => setActualCost(e.target.value)} placeholder="선택" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none min-h-11" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-1"><Tag size={16} /> 태그 선택</label>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1">
                    {COMMON_TAGS.map((tag) => (
                      <button key={tag} type="button" onClick={() => toggleTag(tag)} className={`text-[10px] px-2 py-1 rounded-full border transition-all min-h-8 ${selectedTags.includes(tag) ? 'bg-primary text-white border-primary' : 'bg-white text-gray-400 border-gray-100'}`}>
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-500 mb-1 block">비용 카테고리</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value as NewPlace['category'])} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none min-h-11">
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-1"><FileText size={16} /> 메모</label>
                <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="가족들과 함께할 활동이나 주의사항을 적어주세요" rows={3} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none resize-none" />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-1"><ListChecks size={16} /> 체크리스트(쉼표 구분)</label>
                  <input value={checklistRaw} onChange={(e) => setChecklistRaw(e.target.value)} placeholder="예: 유모차, 물, 간식" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none min-h-11" />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-500 mb-1 block">가족 공유 메모</label>
                  <textarea value={sharedNote} onChange={(e) => setSharedNote(e.target.value)} rows={2} placeholder="부모/아이/어르신 메모를 남겨보세요" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none resize-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400">위도 (Lat)</label>
                  <input type="text" value={lat} onChange={(e) => setLat(e.target.value)} className="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400">경도 (Lng)</label>
                  <input type="text" value={lng} onChange={(e) => setLng(e.target.value)} className="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs" />
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button type="submit" className="w-full min-h-11 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-orange-100 hover:bg-orange-400 transition-all mt-4">
                일정에 추가하기
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

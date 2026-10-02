import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Bookmark,
  BookmarkCheck,
  Share2,
  Clock,
  X,
  CheckCircle2,
  Lightbulb
} from 'lucide-react';
import { HealthTipItem, AppLanguage } from '../../types';
import { SEED_HEALTH_TIPS } from '../../data/seedData';
import { getTranslation } from '../../i18n/translations';

interface HealthTipsScreenProps {
  lang: AppLanguage;
  showToast: (type: 'success' | 'info' | 'error' | 'warning', title: string, message: string) => void;
}

export const HealthTipsScreen: React.FC<HealthTipsScreenProps> = ({ lang, showToast }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [savedTipIds, setSavedTipIds] = useState<string[]>(['tip-1']);
  const [readingTip, setReadingTip] = useState<HealthTipItem | null>(null);

  const categories = ['All', 'Medication Safety', 'Nutrition', 'Chronic Care', 'Emergency', 'Saved'];

  const toggleBookmark = (id: string, title: string) => {
    setSavedTipIds((prev) => {
      const exists = prev.includes(id);
      const updated = exists ? prev.filter((item) => item !== id) : [...prev, id];
      showToast('info', exists ? 'Tip Removed' : 'Tip Saved', `"${title}" ${exists ? 'removed from' : 'saved to'} bookmarks.`);
      return updated;
    });
  };

  const filteredTips = useMemo(() => {
    return SEED_HEALTH_TIPS.filter((tip) => {
      if (selectedCategory === 'Saved' && !savedTipIds.includes(tip.id)) return false;
      if (selectedCategory !== 'All' && selectedCategory !== 'Saved' && tip.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          tip.title.toLowerCase().includes(q) ||
          tip.summary.toLowerCase().includes(q) ||
          tip.content.some((c) => c.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [searchQuery, selectedCategory, savedTipIds]);

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto pb-24">
      {/* 1. Header */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#0F172A]">Health & Safety Tips</h2>
            <p className="text-xs text-slate-500">Verified clinical pharmacy guidance & daily wellness</p>
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            id="input-health-tips-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search health tips, precautions, diet..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9]"
          />
        </div>
      </div>

      {/* 2. Categories */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                isSelected
                  ? 'bg-[#0F4C81] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* 3. List of Tips */}
      <div className="space-y-3">
        {filteredTips.map((tip) => {
          const isBookmarked = savedTipIds.includes(tip.id);

          return (
            <div
              key={tip.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:border-sky-300 transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-[#0F4C81] border border-sky-100">
                  {tip.category}
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{tip.readTime}</span>
                  </span>
                  <button
                    onClick={() => toggleBookmark(tip.id, tip.title)}
                    className="p-1 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    {isBookmarked ? (
                      <BookmarkCheck className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <h3 className="text-sm font-extrabold text-[#0F172A] mb-1 leading-snug">
                {tip.title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">{tip.summary}</p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  onClick={() => setReadingTip(tip)}
                  className="text-xs font-bold text-[#0EA5E9] hover:underline flex items-center gap-1"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Read Article</span>
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${tip.title}\n\n${tip.summary}`);
                    showToast('info', 'Shared', 'Tip summary copied to clipboard.');
                  }}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Reader Modal */}
      {readingTip && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-5 shadow-2xl border border-slate-200 flex flex-col max-h-[85vh] overflow-hidden">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-[#0F4C81]">
                  {readingTip.category}
                </span>
                <h3 className="text-base font-extrabold text-[#0F172A] mt-1">
                  {readingTip.title}
                </h3>
              </div>
              <button
                onClick={() => setReadingTip(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-2 my-2 overflow-y-auto space-y-3">
              <div className="space-y-2">
                {readingTip.content.map((para: string, pIdx: number) => (
                  <p key={pIdx} className="text-xs text-slate-700 leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>

              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5">
                <span className="text-xs font-bold text-amber-900 block mb-1">
                  Key Takeaways:
                </span>
                {readingTip.keyTakeaways.map((point: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-amber-900">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
              <button
                onClick={() => toggleBookmark(readingTip.id, readingTip.title)}
                className="text-xs font-bold text-slate-600 flex items-center gap-1.5 hover:text-amber-600"
              >
                {savedTipIds.includes(readingTip.id) ? (
                  <>
                    <BookmarkCheck className="w-4 h-4 text-amber-500" />
                    <span>Saved in Bookmarks</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" />
                    <span>Bookmark Article</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setReadingTip(null)}
                className="px-4 py-2 rounded-xl bg-[#0EA5E9] text-white text-xs font-bold hover:bg-[#0284C7]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

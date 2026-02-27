import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Brain, AlertTriangle, CheckCircle, Lightbulb, Loader2, RefreshCw, X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import api from '../lib/axios';
import { Button } from './ui/button';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SimplifiedValue {
  value: string;
  unit: string;
  normalRange: string;
  status: 'NORMAL' | 'LOW' | 'HIGH' | 'CRITICAL';
  plainExplanation: string;
}

interface AISummary {
  summaryText: string;
  simplifiedValues?: Record<string, SimplifiedValue>;
  riskLevel: 'NORMAL' | 'BORDERLINE' | 'ABNORMAL' | 'CRITICAL';
  concerns?: string[];
  goodNews?: string[];
  recommendations?: string[];
  disclaimer?: string;
  modelUsed?: string;
}

interface AISummaryModalProps {
  recordId: string;
  recordTitle: string;
  existingSummary?: { riskLevel: string; summaryText: string } | null;
  onClose: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const riskColors: Record<string, string> = {
  NORMAL: 'text-green-600 bg-green-50 border-green-200',
  BORDERLINE: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  ABNORMAL: 'text-orange-600 bg-orange-50 border-orange-200',
  CRITICAL: 'text-red-600 bg-red-50 border-red-200',
};

const statusIcon = (status: string) => {
  if (status === 'HIGH' || status === 'CRITICAL') return <TrendingUp className="w-4 h-4 text-red-500" />;
  if (status === 'LOW') return <TrendingDown className="w-4 h-4 text-blue-500" />;
  return <Minus className="w-4 h-4 text-green-500" />;
};

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    NORMAL: 'bg-green-100 text-green-700',
    LOW: 'bg-blue-100 text-blue-700',
    HIGH: 'bg-orange-100 text-orange-700',
    CRITICAL: 'bg-red-100 text-red-700',
  };
  return map[status] ?? 'bg-gray-100 text-gray-700';
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AISummaryModal({ recordId, recordTitle, existingSummary, onClose }: AISummaryModalProps) {
  const [forceRefresh, setForceRefresh] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['ai-summary', recordId, forceRefresh],
    queryFn: async () => {
      const res = await api.post(`/api/v1/records/${recordId}/decode`);
      return res.data.data as { summary: AISummary; cached: boolean };
    },
    staleTime: 5 * 60 * 1000,
  });

  const summary = data?.summary;
  const riskLevel = summary?.riskLevel ?? existingSummary?.riskLevel ?? 'NORMAL';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
              <Brain className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">AI Report Summary</h2>
              <p className="text-sm text-gray-500 truncate max-w-xs">{recordTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-16 h-16 rounded-full bg-violet-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-700">Analysing your report…</p>
                <p className="text-sm text-gray-500 mt-1">AI is reading your results and preparing a plain-language summary</p>
              </div>
            </div>
          )}

          {isError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
              <p className="text-red-700 font-medium">Could not generate summary</p>
              <p className="text-red-500 text-sm mt-1">
                {error instanceof Error ? error.message : 'Please try again later'}
              </p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
                Try Again
              </Button>
            </div>
          )}

          {summary && (
            <>
              {/* Risk Level Badge */}
              <div className={`flex items-center gap-3 p-4 rounded-xl border ${riskColors[riskLevel]}`}>
                <div className="flex-1">
                  <p className="font-semibold text-sm uppercase tracking-wide">Overall Assessment</p>
                  <p className="text-lg font-bold mt-0.5">{riskLevel}</p>
                </div>
                {data?.cached && (
                  <span className="text-xs px-2 py-1 rounded-full bg-white/60 font-medium">Cached</span>
                )}
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">📋 What This Means</p>
                <p className="text-gray-700 leading-relaxed">{summary.summaryText}</p>
              </div>

              {/* Simplified Values Table */}
              {summary.simplifiedValues && Object.keys(summary.simplifiedValues).length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">🔬 Your Results Explained</p>
                  <div className="space-y-2">
                    {Object.entries(summary.simplifiedValues).map(([key, val]) => (
                      <div key={key} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="mt-0.5">{statusIcon(val.status)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-gray-800 text-sm">{key}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(val.status)}`}>
                              {val.value} {val.unit}
                            </span>
                            <span className="text-xs text-gray-400">Normal: {val.normalRange}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{val.plainExplanation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Concerns */}
              {summary.concerns && summary.concerns.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <p className="text-sm font-semibold text-red-700 mb-2">🔴 Areas of Concern</p>
                  <ul className="space-y-1">
                    {summary.concerns.map((c, i) => (
                      <li key={i} className="text-sm text-red-600 flex items-start gap-2">
                        <span className="mt-1">•</span> {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Good news */}
              {summary.goodNews && summary.goodNews.length > 0 && (
                <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                  <p className="text-sm font-semibold text-green-700 mb-2">✅ Good News</p>
                  <ul className="space-y-1">
                    {summary.goodNews.map((g, i) => (
                      <li key={i} className="text-sm text-green-600 flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> {g}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {summary.recommendations && summary.recommendations.length > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-sm font-semibold text-blue-700 mb-2">💡 Recommendations</p>
                  <ul className="space-y-1">
                    {summary.recommendations.map((r, i) => (
                      <li key={i} className="text-sm text-blue-600 flex items-start gap-2">
                        <Lightbulb className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Disclaimer */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700">
                  {summary.disclaimer ?? 'This AI summary is for educational purposes only. Please consult your doctor for medical advice.'}
                  {summary.modelUsed && ` (Generated by ${summary.modelUsed})`}
                </p>
              </div>

              {/* Refresh */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setForceRefresh(v => !v); }}
                  className="gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Regenerate Summary
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

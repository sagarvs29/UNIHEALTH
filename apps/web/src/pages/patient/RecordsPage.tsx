import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import api from '../../lib/axios';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import AISummaryModal from '../../components/AISummaryModal';

type RecordType =
  | 'LAB_REPORT'
  | 'IMAGING'
  | 'PRESCRIPTION'
  | 'DISCHARGE_SUMMARY'
  | 'VACCINATION'
  | 'CONSULTATION_NOTE'
  | 'INSURANCE_DOCUMENT'
  | 'OTHER';

interface MedicalRecord {
  id: string;
  recordType: RecordType;
  title: string;
  description?: string;
  fileUrl: string;
  fileMimeType: string;
  fileSizeBytes: number;
  testDate?: string;
  labName?: string;
  createdAt: string;
}

const RECORD_TYPE_LABELS: Record<RecordType, string> = {
  LAB_REPORT: '🧪 Lab Report',
  IMAGING: '🩻 Imaging',
  PRESCRIPTION: '💊 Prescription',
  DISCHARGE_SUMMARY: '🏥 Discharge Summary',
  VACCINATION: '💉 Vaccination',
  CONSULTATION_NOTE: '📋 Consultation Note',
  INSURANCE_DOCUMENT: '📄 Insurance Document',
  OTHER: '📁 Other',
};

export default function RecordsPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [aiModalRecord, setAiModalRecord] = useState<{ id: string; title: string } | null>(null);

  const fetchRecords = async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string | number> = { page, limit: 10 };
      if (filterType) params.type = filterType;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await api.get('/records', { params });
      setRecords(res.data.data.records);
      setTotalPages(res.data.data.totalPages ?? 1);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message ?? 'Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [page, filterType, startDate, endDate]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Medical Records</h1>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-40">
                <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={filterType}
                  onChange={e => { setFilterType(e.target.value); setPage(1); }}
                >
                  <option value="">All Types</option>
                  {(Object.keys(RECORD_TYPE_LABELS) as RecordType[]).map(k => (
                    <option key={k} value={k}>{RECORD_TYPE_LABELS[k]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
                <Input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
                <Input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Records List */}
        {loading ? (
          <div className="text-center py-16 text-gray-500">Loading records…</div>
        ) : error ? (
          <div className="text-center py-16 text-red-500">{error}</div>
        ) : records.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No records found.</div>
        ) : (
          <div className="space-y-4">
            {records.map(rec => (
              <Card key={rec.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-primary-600">
                          {RECORD_TYPE_LABELS[rec.recordType]}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-400">{formatSize(rec.fileSizeBytes)}</span>
                      </div>
                      <p className="font-medium text-gray-800">{rec.title}</p>
                      {rec.description && <p className="text-sm text-gray-500 mt-1">{rec.description}</p>}
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                        {rec.testDate && <span>📅 Test date: {format(new Date(rec.testDate), 'dd MMM yyyy')}</span>}
                        {rec.labName && <span>🏥 {rec.labName}</span>}
                        <span>Uploaded: {format(new Date(rec.createdAt), 'dd MMM yyyy, HH:mm')}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-purple-600 border-purple-200 hover:bg-purple-50"
                        onClick={() => setAiModalRecord({ id: rec.id, title: rec.title })}
                      >
                        🧠 AI Summary
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPreviewUrl(rec.fileUrl)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Pagination */}
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                ← Prev
              </Button>
              <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                Next →
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* File Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold">Document Preview</h2>
              <div className="flex gap-2">
                <a href={previewUrl} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="outline">Open in new tab ↗</Button>
                </a>
                <Button size="sm" variant="outline" onClick={() => setPreviewUrl(null)}>✕ Close</Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-2">
              {previewUrl.includes('.pdf') || previewUrl.includes('application/pdf') ? (
                <iframe src={previewUrl} className="w-full h-[75vh]" title="PDF Preview" />
              ) : (
                <img src={previewUrl} alt="Record" className="max-w-full mx-auto" />
              )}
            </div>
          </div>
        </div>
      )}
      {/* AI Summary Modal */}
      {aiModalRecord && (
        <AISummaryModal
          recordId={aiModalRecord.id}
          recordTitle={aiModalRecord.title}
          onClose={() => setAiModalRecord(null)}
        />
      )}
    </div>
  );
}

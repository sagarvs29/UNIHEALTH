import { useRef, useState } from 'react';
import api from '../../lib/axios';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

const RECORD_TYPES = [
  'LAB_REPORT',
  'IMAGING',
  'PRESCRIPTION',
  'DISCHARGE_SUMMARY',
  'VACCINATION',
  'CONSULTATION_NOTE',
  'INSURANCE_DOCUMENT',
  'OTHER',
];

export default function UploadRecordPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [form, setForm] = useState({
    patientUhid: '',
    recordType: 'LAB_REPORT',
    title: '',
    description: '',
    testDate: '',
    labName: '',
  });
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return showToast('error', 'Please select a file to upload.');
    if (!form.patientUhid.trim()) return showToast('error', 'Patient UHID is required.');
    if (!form.title.trim()) return showToast('error', 'Title is required.');

    const fd = new FormData();
    fd.append('file', file);
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });

    setUploading(true);
    try {
      const res = await api.post('/records/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast('success', `Record uploaded successfully (ID: ${res.data.data.id})`);
      setFile(null);
      setForm({ patientUhid: '', recordType: 'LAB_REPORT', title: '', description: '', testDate: '', labName: '' });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast('error', e.response?.data?.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Medical Record</h1>
        <p className="text-gray-500 text-sm mb-6">Upload patient documents securely to UniHealth ID.</p>

        {toast && (
          <div className={`mb-4 p-3 rounded-lg text-sm border ${
            toast.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {toast.msg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Card className="mb-5">
            <CardContent className="pt-4 space-y-4">
              {/* File Drop Zone */}
              <div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  drag ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onDragOver={e => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={e => setFile(e.target.files?.[0] ?? null)}
                />
                {file ? (
                  <div>
                    <div className="text-3xl mb-2">
                      {file.type.includes('pdf') ? '📄' : '🖼️'}
                    </div>
                    <p className="font-medium text-gray-700">{file.name}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {(file.size / 1024).toFixed(1)} KB · {file.type}
                    </p>
                    <button
                      type="button"
                      className="mt-2 text-xs text-red-500 hover:underline"
                      onClick={e => { e.stopPropagation(); setFile(null); }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="text-4xl mb-3">📁</div>
                    <p className="text-gray-600 font-medium">Drop file here or click to browse</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, PNG, JPG, JPEG · Max 10MB</p>
                  </div>
                )}
              </div>

              {/* Patient UHID */}
              <div>
                <Label htmlFor="uhid">Patient UHID *</Label>
                <Input
                  id="uhid"
                  placeholder="e.g. UHID-XXXXX"
                  value={form.patientUhid}
                  onChange={e => setForm(f => ({ ...f, patientUhid: e.target.value }))}
                />
              </div>

              {/* Record Type */}
              <div>
                <Label htmlFor="recordType">Record Type *</Label>
                <select
                  id="recordType"
                  className="w-full border rounded-md px-3 py-2 text-sm mt-1"
                  value={form.recordType}
                  onChange={e => setForm(f => ({ ...f, recordType: e.target.value }))}
                >
                  {RECORD_TYPES.map(t => (
                    <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g. Complete Blood Count - June 2025"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="desc">Description (optional)</Label>
                <textarea
                  id="desc"
                  rows={2}
                  className="w-full border rounded-md px-3 py-2 text-sm mt-1 resize-none"
                  placeholder="Brief notes about this document…"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>

              {/* Test Date & Lab Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="testDate">Test / Procedure Date</Label>
                  <Input
                    id="testDate"
                    type="date"
                    value={form.testDate}
                    onChange={e => setForm(f => ({ ...f, testDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="labName">Lab / Facility Name</Label>
                  <Input
                    id="labName"
                    placeholder="e.g. City Diagnostics"
                    value={form.labName}
                    onChange={e => setForm(f => ({ ...f, labName: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={uploading}>
            {uploading ? 'Uploading…' : '⬆ Upload Record'}
          </Button>
        </form>
      </div>
    </div>
  );
}

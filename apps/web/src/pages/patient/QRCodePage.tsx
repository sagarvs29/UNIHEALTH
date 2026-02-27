import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import api from '../../lib/axios';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

interface QRCode {
  id: string;
  accessCode: string;
  qrImageUrl: string;
  scope: string[];
  qrType: string;
  expiresAt: string;
  isRevoked: boolean;
  scanCount: number;
  createdAt: string;
}

export default function QRCodePage() {
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [showGenModal, setShowGenModal] = useState(false);
  const [genForm, setGenForm] = useState({
    qrType: 'DOCTOR_SESSION',
    scope: ['ALL'],
    expiresInHours: 1,
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const fetchQRCodes = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/qr/mine');
      setQrCodes(res.data.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message ?? 'Failed to load QR codes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQRCodes(); }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.post('/qr/generate', genForm);
      showToast('✅ QR code generated!');
      setShowGenModal(false);
      fetchQRCodes();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast('❌ ' + (e.response?.data?.message ?? 'Failed to generate'));
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async (qrId: string) => {
    if (!confirm('Revoke this QR code? It will no longer be scannable.')) return;
    try {
      await api.delete(`/qr/${qrId}`);
      showToast('QR code revoked.');
      fetchQRCodes();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast('❌ ' + (e.response?.data?.message ?? 'Failed to revoke'));
    }
  };

  const qrTypeLabels: Record<string, string> = {
    DOCTOR_SESSION: '👨‍⚕️ Doctor Session',
    EMERGENCY: '🚨 Emergency',
    INSURANCE_CLAIM: '🏢 Insurance Claim',
    PHARMACY: '💊 Pharmacy',
    GENERAL: '📋 General',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My QR Codes</h1>
            <p className="text-gray-500 text-sm mt-1">Share these with doctors or emergency services for instant health record access.</p>
          </div>
          <Button onClick={() => setShowGenModal(true)}>+ Generate QR</Button>
        </div>

        {toast && (
          <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm">
            {toast}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-500">Loading…</div>
        ) : error ? (
          <div className="text-center py-16 text-red-500">{error}</div>
        ) : qrCodes.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No QR codes yet. Generate one to share with a doctor or for emergencies.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {qrCodes.map(qr => (
              <Card key={qr.id} className={`border ${qr.isRevoked ? 'opacity-50' : ''}`}>
                <CardContent className="pt-4 flex gap-4">
                  <div className="flex-shrink-0">
                    <img
                      src={qr.qrImageUrl}
                      alt={`QR ${qr.accessCode}`}
                      className="w-24 h-24 rounded-md border"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold">{qrTypeLabels[qr.qrType] ?? qr.qrType}</span>
                      {qr.isRevoked && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Revoked</span>
                      )}
                      {!qr.isRevoked && new Date(qr.expiresAt) < new Date() && (
                        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">Expired</span>
                      )}
                      {!qr.isRevoked && new Date(qr.expiresAt) >= new Date() && (
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Active</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 font-mono mb-1">#{qr.accessCode}</p>
                    <p className="text-xs text-gray-500">Scope: {qr.scope.join(', ')}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Expires: {format(new Date(qr.expiresAt), 'dd MMM yyyy, HH:mm')}
                    </p>
                    <p className="text-xs text-gray-400">Scanned {qr.scanCount} time(s)</p>
                    {!qr.isRevoked && (
                      <div className="flex gap-2 mt-3">
                        <a href={qr.qrImageUrl} download={`qr-${qr.accessCode}.png`}>
                          <Button size="sm" variant="outline">⬇ Download</Button>
                        </a>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => handleRevoke(qr.id)}
                        >
                          Revoke
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Generate Modal */}
      {showGenModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold mb-4">Generate QR Code</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">QR Type</label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={genForm.qrType}
                  onChange={e => setGenForm(f => ({ ...f, qrType: e.target.value }))}
                >
                  {Object.entries(qrTypeLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expires in (hours)
                </label>
                <input
                  type="number"
                  min={1}
                  max={720}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={genForm.expiresInHours}
                  onChange={e => setGenForm(f => ({ ...f, expiresInHours: parseInt(e.target.value) || 1 }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Scope</label>
                <div className="flex flex-wrap gap-2">
                  {['ALL', 'LAB_REPORT', 'IMAGING', 'PRESCRIPTION', 'ALLERGIES', 'EMERGENCY_INFO'].map(scope => (
                    <label key={scope} className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={genForm.scope.includes(scope)}
                        onChange={e => {
                          if (scope === 'ALL') {
                            setGenForm(f => ({ ...f, scope: e.target.checked ? ['ALL'] : [] }));
                          } else {
                            setGenForm(f => ({
                              ...f,
                              scope: e.target.checked
                                ? [...f.scope.filter(s => s !== 'ALL'), scope]
                                : f.scope.filter(s => s !== scope),
                            }));
                          }
                        }}
                      />
                      {scope}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button className="flex-1" onClick={handleGenerate} disabled={generating}>
                {generating ? 'Generating…' : 'Generate'}
              </Button>
              <Button variant="outline" onClick={() => setShowGenModal(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

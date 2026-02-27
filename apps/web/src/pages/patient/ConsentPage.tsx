import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import api from '../../lib/axios';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

type ConsentStatus = 'PENDING' | 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'DENIED';

interface ConsentEntry {
  id: string;
  status: ConsentStatus;
  purpose: string;
  scope: string[];
  grantedToType: 'DOCTOR' | 'INSURANCE_PROVIDER';
  expiresAt?: string;
  createdAt: string;
  doctor?: { firstName: string; lastName: string; specialization: string };
  insuranceProvider?: { companyName: string };
}

const STATUS_STYLES: Record<ConsentStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  ACTIVE: 'bg-green-100 text-green-700 border-green-200',
  REVOKED: 'bg-gray-100 text-gray-500 border-gray-200',
  EXPIRED: 'bg-red-100 text-red-400 border-red-200',
  DENIED: 'bg-red-100 text-red-600 border-red-200',
};

export default function ConsentPage() {
  const [consents, setConsents] = useState<ConsentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const fetchConsents = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/consents/my');
      setConsents(res.data.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message ?? 'Failed to load consents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConsents(); }, []);

  const handleApprove = async (consentId: string) => {
    const otp = otpInputs[consentId]?.trim();
    if (!otp || otp.length !== 6) return showToast('Please enter the 6-digit OTP sent to you.');
    setActionLoading(consentId + '_approve');
    try {
      await api.post('/consents/approve', { consentId, otp });
      showToast('✅ Consent approved!');
      fetchConsents();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast('❌ ' + (e.response?.data?.message ?? 'Failed to approve'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeny = async (consentId: string) => {
    setActionLoading(consentId + '_deny');
    try {
      await api.post('/consents/deny', { consentId });
      showToast('Consent denied.');
      fetchConsents();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast('❌ ' + (e.response?.data?.message ?? 'Failed to deny'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async (consentId: string) => {
    if (!confirm('Revoke this consent? The provider will lose access to your records.')) return;
    setActionLoading(consentId + '_revoke');
    try {
      await api.post('/consents/revoke', { consentId });
      showToast('Consent revoked.');
      fetchConsents();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast('❌ ' + (e.response?.data?.message ?? 'Failed to revoke'));
    } finally {
      setActionLoading(null);
    }
  };

  const getRequesterName = (c: ConsentEntry) => {
    if (c.doctor) return `Dr. ${c.doctor.firstName} ${c.doctor.lastName} (${c.doctor.specialization})`;
    if (c.insuranceProvider) return c.insuranceProvider.companyName;
    return 'Unknown';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Consent Management</h1>
        <p className="text-gray-500 text-sm mb-6">Review and manage who has access to your health data.</p>

        {/* Toast */}
        {toast && (
          <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm">
            {toast}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-500">Loading consents…</div>
        ) : error ? (
          <div className="text-center py-16 text-red-500">{error}</div>
        ) : consents.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No consent requests yet.</div>
        ) : (
          <div className="space-y-4">
            {consents.map(c => (
              <Card key={c.id} className="border">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[c.status]}`}>
                          {c.status}
                        </span>
                        <span className="text-xs text-gray-400">
                          {c.grantedToType === 'DOCTOR' ? '👨‍⚕️ Doctor' : '🏢 Insurance'}
                        </span>
                      </div>
                      <p className="font-medium text-gray-800">{getRequesterName(c)}</p>
                      <p className="text-sm text-gray-500 mt-1">Purpose: {c.purpose}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Scope: {c.scope.join(', ')}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Requested: {format(new Date(c.createdAt), 'dd MMM yyyy, HH:mm')}
                        {c.expiresAt && ` · Expires: ${format(new Date(c.expiresAt), 'dd MMM yyyy')}`}
                      </p>
                    </div>
                  </div>

                  {/* Actions for PENDING */}
                  {c.status === 'PENDING' && (
                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                      <p className="text-xs text-yellow-700 mb-2 font-medium">
                        Enter the OTP sent to your registered mobile/email to approve:
                      </p>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          maxLength={6}
                          placeholder="6-digit OTP"
                          className="w-32 text-center tracking-widest font-mono"
                          value={otpInputs[c.id] ?? ''}
                          onChange={e => setOtpInputs(prev => ({ ...prev, [c.id]: e.target.value }))}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleApprove(c.id)}
                          disabled={actionLoading === c.id + '_approve'}
                        >
                          {actionLoading === c.id + '_approve' ? '…' : 'Approve'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeny(c.id)}
                          disabled={actionLoading === c.id + '_deny'}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          {actionLoading === c.id + '_deny' ? '…' : 'Deny'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Revoke for ACTIVE */}
                  {c.status === 'ACTIVE' && (
                    <div className="mt-3 flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                        onClick={() => handleRevoke(c.id)}
                        disabled={actionLoading === c.id + '_revoke'}
                      >
                        {actionLoading === c.id + '_revoke' ? '…' : 'Revoke Access'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

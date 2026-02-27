import { useState } from 'react';
import { format } from 'date-fns';
import api from '../../lib/axios';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

interface PatientResult {
  id: string;
  uhid: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  allergies: string[];
  chronicConditions: string[];
  consentStatus?: 'ACTIVE' | 'PENDING' | null;
}

interface MedicalRecord {
  id: string;
  recordType: string;
  title: string;
  fileUrl: string;
  createdAt: string;
}

export default function PatientLookupPage() {
  const [uhid, setUhid] = useState('');
  const [patient, setPatient] = useState<PatientResult | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [requestingConsent, setRequestingConsent] = useState(false);
  const [consentPurpose, setConsentPurpose] = useState('');
  const [showConsentForm, setShowConsentForm] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const handleSearch = async () => {
    if (!uhid.trim()) return;
    setSearching(true);
    setError('');
    setPatient(null);
    setRecords([]);
    try {
      // Try to get records (will work if consent active, else returns limited info)
      const res = await api.get(`/records/patient/${uhid.trim()}`);
      const data = res.data.data;
      setPatient(data.patient);
      setRecords(data.records ?? []);
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { message?: string; patient?: PatientResult } } };
      if (e.response?.status === 403) {
        // No consent — show patient basic info if returned
        if (e.response.data?.patient) {
          setPatient(e.response.data.patient);
        }
        setError('You do not have active consent to view this patient\'s full records.');
      } else {
        setError(e.response?.data?.message ?? 'Patient not found');
      }
    } finally {
      setSearching(false);
    }
  };

  const handleRequestConsent = async () => {
    if (!patient || !consentPurpose.trim()) return;
    setRequestingConsent(true);
    try {
      await api.post('/consents/request', {
        patientUhid: patient.uhid,
        purpose: consentPurpose,
        scope: ['ALL'],
        durationHours: 24,
        grantedToType: 'DOCTOR',
      });
      showToast('✅ Consent request sent! Patient will receive an OTP to approve.');
      setShowConsentForm(false);
      setConsentPurpose('');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast('❌ ' + (e.response?.data?.message ?? 'Failed to request consent'));
    } finally {
      setRequestingConsent(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Patient Lookup</h1>
        <p className="text-gray-500 text-sm mb-6">Search for a patient by UHID to view their records (consent required).</p>

        {toast && (
          <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm">
            {toast}
          </div>
        )}

        {/* Search Box */}
        <div className="flex gap-3 mb-6">
          <Input
            placeholder="Enter Patient UHID…"
            value={uhid}
            onChange={e => setUhid(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={searching}>
            {searching ? 'Searching…' : '🔍 Search'}
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 text-sm">
            {error}
          </div>
        )}

        {/* Patient Card */}
        {patient && (
          <Card className="mb-6">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {patient.firstName} {patient.lastName}
                  </h2>
                  <p className="text-sm text-gray-500 font-mono mt-0.5">{patient.uhid}</p>
                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                    {patient.dateOfBirth && (
                      <span>🎂 DOB: {format(new Date(patient.dateOfBirth), 'dd MMM yyyy')}</span>
                    )}
                    {patient.bloodGroup && <span>🩸 {patient.bloodGroup}</span>}
                  </div>
                  {patient.allergies.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs font-medium text-red-600">⚠️ Allergies: </span>
                      <span className="text-xs text-gray-600">{patient.allergies.join(', ')}</span>
                    </div>
                  )}
                  {patient.chronicConditions.length > 0 && (
                    <div className="mt-1">
                      <span className="text-xs font-medium text-orange-600">🏥 Conditions: </span>
                      <span className="text-xs text-gray-600">{patient.chronicConditions.join(', ')}</span>
                    </div>
                  )}
                </div>
                {!patient.consentStatus && (
                  <Button
                    size="sm"
                    onClick={() => setShowConsentForm(!showConsentForm)}
                  >
                    Request Consent
                  </Button>
                )}
                {patient.consentStatus === 'PENDING' && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                    Consent Pending
                  </span>
                )}
                {patient.consentStatus === 'ACTIVE' && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    ✓ Consent Active
                  </span>
                )}
              </div>

              {showConsentForm && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <Label className="text-sm font-medium text-blue-800 mb-2 block">
                    Purpose of access request:
                  </Label>
                  <textarea
                    rows={2}
                    className="w-full border rounded-md px-3 py-2 text-sm resize-none"
                    placeholder="e.g. Follow-up consultation for hypertension management"
                    value={consentPurpose}
                    onChange={e => setConsentPurpose(e.target.value)}
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      onClick={handleRequestConsent}
                      disabled={requestingConsent || !consentPurpose.trim()}
                    >
                      {requestingConsent ? 'Sending…' : 'Send Request'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowConsentForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Records */}
        {records.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-3">Medical Records ({records.length})</h3>
            <div className="space-y-2">
              {records.map(r => (
                <Card key={r.id} className="hover:shadow-sm">
                  <CardContent className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-gray-800">{r.title}</p>
                      <p className="text-xs text-gray-400">
                        {r.recordType.replace(/_/g, ' ')} · {format(new Date(r.createdAt), 'dd MMM yyyy')}
                      </p>
                    </div>
                    <a href={r.fileUrl} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline">View</Button>
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Write Prescription Link */}
        {patient && patient.consentStatus === 'ACTIVE' && (
          <a href={`/doctor/prescriptions?uhid=${patient.uhid}`}>
            <Button className="w-full" variant="outline">
              ✍️ Write Prescription for {patient.firstName}
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}

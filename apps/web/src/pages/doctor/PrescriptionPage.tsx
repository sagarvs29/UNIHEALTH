import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../../lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

interface PharmaInteraction {
  drug1: string;
  drug2: string;
  severity: string;
  effect: string;
  alternative?: string;
}

interface PharmaCheckResult {
  safe: boolean;
  severity: string;
  interactions: PharmaInteraction[];
  allergyConflicts: string[];
  conditionConflicts: string[];
}

interface PrescriptionItem {
  medicineName: string;
  genericName: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  instructions: string;
}

interface Prescription {
  id: string;
  createdAt: string;
  diagnosis?: string;
  notes?: string;
  hasInteractions: boolean;
  items: (PrescriptionItem & { id: string })[];
}

const emptyItem = (): PrescriptionItem => ({
  medicineName: '',
  genericName: '',
  dosage: '',
  frequency: 'Twice daily',
  duration: '7 days',
  route: 'Oral',
  instructions: '',
});

export default function PrescriptionPage() {
  const [searchParams] = useSearchParams();
  const prefillUhid = searchParams.get('uhid') ?? '';

  const [patientUhid, setPatientUhid] = useState(prefillUhid);
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<PrescriptionItem[]>([emptyItem()]);
  const [pharmaCheck, setPharmaCheck] = useState<PharmaCheckResult | null>(null);
  const [pharmaLoading, setPharmaLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [override, setOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warn'; msg: string } | null>(null);
  const [pastPrescriptions, setPastPrescriptions] = useState<Prescription[]>([]);

  const showToast = (type: 'success' | 'error' | 'warn', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    if (prefillUhid) {
      loadHistory(prefillUhid);
    }
  }, [prefillUhid]);

  const loadHistory = async (uhid: string) => {
    try {
      const res = await api.get(`/prescriptions/patient/${uhid}`);
      setPastPrescriptions(res.data.data);
    } catch {
      // consent not yet given or no history
    }
  };

  const addItem = () => setItems(p => [...p, emptyItem()]);
  const removeItem = (idx: number) => setItems(p => p.filter((_, i) => i !== idx));
  const updateItem = (idx: number, key: keyof PrescriptionItem, value: string) => {
    setItems(p => p.map((item, i) => i === idx ? { ...item, [key]: value } : item));
  };

  const runPharmaCheck = async () => {
    const drugs = items.map(i => `${i.medicineName} ${i.dosage}`.trim()).filter(Boolean);
    if (drugs.length === 0) return showToast('warn', 'Add at least one medicine first.');
    setPharmaLoading(true);
    setPharmaCheck(null);
    try {
      const res = await api.post('/prescriptions/pharma-check', {
        currentDrugs: drugs,
        newDrug: drugs[drugs.length - 1],
      });
      setPharmaCheck(res.data.data);
      if (!res.data.data.safe) {
        showToast('warn', '⚠️ Interaction detected! Review before saving.');
      } else {
        showToast('success', '✅ No interactions found — safe to prescribe.');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast('error', e.response?.data?.message ?? 'Pharma check failed');
    } finally {
      setPharmaLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientUhid.trim()) return showToast('error', 'Patient UHID is required');
    const filled = items.filter(i => i.medicineName.trim() && i.dosage.trim());
    if (filled.length === 0) return showToast('error', 'Add at least one medicine');
    if (pharmaCheck && !pharmaCheck.safe && !override) {
      return showToast('warn', 'You must override drug interaction warning or remove conflicting drugs.');
    }

    setSubmitting(true);
    try {
      await api.post('/prescriptions', {
        patientUhid,
        diagnosis,
        notes,
        items: filled,
        overrideInteraction: override,
        overrideReason: override ? overrideReason : undefined,
      });
      showToast('success', '✅ Prescription saved!');
      setItems([emptyItem()]);
      setDiagnosis('');
      setNotes('');
      setPharmaCheck(null);
      setOverride(false);
      loadHistory(patientUhid);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; requiresOverride?: boolean } } };
      if (e.response?.data?.requiresOverride) {
        setPharmaCheck(e.response.data as unknown as PharmaCheckResult);
        showToast('warn', '⚠️ Drug interaction detected — override required.');
      } else {
        showToast('error', e.response?.data?.message ?? 'Failed to save prescription');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const toastColors = {
    success: 'bg-green-50 border-green-200 text-green-700',
    error: 'bg-red-50 border-red-200 text-red-700',
    warn: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  };

  const severityColor = (s: string) =>
    s === 'HIGH' ? 'text-red-600' : s === 'MODERATE' ? 'text-orange-500' : 'text-yellow-600';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Write Prescription</h1>

        {toast && (
          <div className={`mb-4 p-3 rounded-lg text-sm border ${toastColors[toast.type]}`}>
            {toast.msg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Patient + Diagnosis */}
          <Card className="mb-5">
            <CardHeader><CardTitle className="text-base">Patient & Diagnosis</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Patient UHID *</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      placeholder="UHID-XXXXX"
                      value={patientUhid}
                      onChange={e => setPatientUhid(e.target.value)}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={() => loadHistory(patientUhid)}>
                      Load History
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Diagnosis / ICD Code</Label>
                  <Input
                    placeholder="e.g. J06.9 — Acute upper respiratory infection"
                    value={diagnosis}
                    onChange={e => setDiagnosis(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>Clinical Notes</Label>
                <textarea
                  rows={2}
                  className="w-full border rounded-md px-3 py-2 text-sm mt-1 resize-none"
                  placeholder="Additional notes for the pharmacist or patient…"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Medicines */}
          <Card className="mb-5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Medicines</CardTitle>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={runPharmaCheck} disabled={pharmaLoading}>
                    {pharmaLoading ? 'Checking…' : '🔬 Pharma Check'}
                  </Button>
                  <Button type="button" size="sm" onClick={addItem}>+ Add Row</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item, idx) => (
                  <div key={idx} className="p-3 border rounded-lg bg-gray-50 relative">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <Label className="text-xs">Medicine Name *</Label>
                        <Input
                          placeholder="e.g. Amoxicillin"
                          value={item.medicineName}
                          onChange={e => updateItem(idx, 'medicineName', e.target.value)}
                          className="mt-1 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Generic Name</Label>
                        <Input
                          placeholder="e.g. Amoxicillin trihydrate"
                          value={item.genericName}
                          onChange={e => updateItem(idx, 'genericName', e.target.value)}
                          className="mt-1 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Dosage *</Label>
                        <Input
                          placeholder="e.g. 500mg"
                          value={item.dosage}
                          onChange={e => updateItem(idx, 'dosage', e.target.value)}
                          className="mt-1 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Frequency</Label>
                        <select
                          className="w-full border rounded-md px-2 py-1.5 text-sm mt-1"
                          value={item.frequency}
                          onChange={e => updateItem(idx, 'frequency', e.target.value)}
                        >
                          {['Once daily', 'Twice daily', 'Three times daily', 'Four times daily',
                            'Every 6 hours', 'Every 8 hours', 'As needed (PRN)', 'At bedtime'].map(f => (
                            <option key={f}>{f}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs">Duration</Label>
                        <Input
                          placeholder="e.g. 7 days"
                          value={item.duration}
                          onChange={e => updateItem(idx, 'duration', e.target.value)}
                          className="mt-1 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Route</Label>
                        <select
                          className="w-full border rounded-md px-2 py-1.5 text-sm mt-1"
                          value={item.route}
                          onChange={e => updateItem(idx, 'route', e.target.value)}
                        >
                          {['Oral', 'IV', 'IM', 'Topical', 'Inhaled', 'Sublingual', 'Rectal', 'Transdermal'].map(r => (
                            <option key={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Special Instructions</Label>
                      <Input
                        placeholder="e.g. Take with food"
                        value={item.instructions}
                        onChange={e => updateItem(idx, 'instructions', e.target.value)}
                        className="mt-1 text-sm"
                      />
                    </div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="absolute top-2 right-2 text-xs text-red-400 hover:text-red-600"
                      >
                        ✕ Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pharma Check Results */}
          {pharmaCheck && (
            <Card className={`mb-5 border-2 ${pharmaCheck.safe ? 'border-green-200' : 'border-red-300'}`}>
              <CardHeader>
                <CardTitle className="text-base">
                  {pharmaCheck.safe ? '✅ Pharma Check — Clear' : '⚠️ Drug Interaction Detected'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pharmaCheck.interactions.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {pharmaCheck.interactions.map((ix, i) => (
                      <div key={i} className="p-2 bg-red-50 rounded border border-red-200 text-sm">
                        <span className={`font-semibold ${severityColor(ix.severity)}`}>[{ix.severity}]</span>{' '}
                        <strong>{ix.drug1}</strong> + <strong>{ix.drug2}</strong>: {ix.effect}
                        {ix.alternative && <p className="text-xs text-gray-500 mt-0.5">Alternative: {ix.alternative}</p>}
                      </div>
                    ))}
                  </div>
                )}
                {pharmaCheck.allergyConflicts.length > 0 && (
                  <div className="p-2 bg-orange-50 rounded border border-orange-200 text-sm mb-2">
                    <span className="font-semibold text-orange-700">⚠️ Allergy conflicts: </span>
                    {pharmaCheck.allergyConflicts.join(', ')}
                  </div>
                )}
                {!pharmaCheck.safe && (
                  <div className="mt-3 p-3 bg-gray-50 rounded border">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={override}
                        onChange={e => setOverride(e.target.checked)}
                      />
                      <span className="font-medium text-gray-700">Override — I acknowledge the risk</span>
                    </label>
                    {override && (
                      <Input
                        placeholder="Reason for override (required)"
                        className="mt-2 text-sm"
                        value={overrideReason}
                        onChange={e => setOverrideReason(e.target.value)}
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Saving…' : '💊 Save Prescription'}
          </Button>
        </form>

        {/* Past Prescriptions */}
        {pastPrescriptions.length > 0 && (
          <div className="mt-8">
            <h3 className="font-semibold text-gray-700 mb-3">
              Prescription History ({pastPrescriptions.length})
            </h3>
            <div className="space-y-3">
              {pastPrescriptions.map(rx => (
                <Card key={rx.id}>
                  <CardContent className="pt-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm text-gray-800">
                          {rx.diagnosis ?? 'No diagnosis noted'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {format(new Date(rx.createdAt), 'dd MMM yyyy, HH:mm')}
                          {rx.hasInteractions && <span className="ml-2 text-orange-500">⚠️ Had interactions</span>}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {rx.items.map(item => (
                        <span key={item.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                          {item.medicineName} {item.dosage}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Heart, AlertTriangle, Phone, Pill, Activity, Loader2, ShieldAlert } from 'lucide-react';
import api from '../../lib/axios';

interface EmergencyData {
  uhid: string;
  name: string;
  bloodGroup: string;
  allergies: string[];
  chronicConditions: string[];
  currentMedications: string[];
  emergencyContacts: { name: string; phone: string; relationship: string; isPrimary: boolean }[];
  isSosActive: boolean;
  sosActivatedAt: string | null;
}

const bloodGroupColors: Record<string, string> = {
  A_POS: 'bg-red-500', A_NEG: 'bg-red-700',
  B_POS: 'bg-orange-500', B_NEG: 'bg-orange-700',
  O_POS: 'bg-blue-500', O_NEG: 'bg-blue-700',
  AB_POS: 'bg-purple-500', AB_NEG: 'bg-purple-700',
  UNKNOWN: 'bg-gray-400',
};

const formatBloodGroup = (bg: string) =>
  bg.replace('_POS', '+').replace('_NEG', '-').replace('_', '');

export default function EmergencyPage() {
  const { uhid } = useParams<{ uhid: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['emergency', uhid],
    queryFn: async () => {
      const res = await api.get(`/api/v1/emergency/${uhid}`);
      return res.data.data as EmergencyData;
    },
    enabled: !!uhid,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
          <p className="text-red-600 font-medium">Loading emergency information…</p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Patient Not Found</h1>
          <p className="text-gray-500">UHID <span className="font-mono font-semibold">{uhid}</span> does not exist in the system.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100">
      {/* Emergency Banner */}
      {data.isSosActive && (
        <div className="bg-red-600 text-white py-3 px-4 text-center animate-pulse">
          <div className="flex items-center justify-center gap-2 font-bold text-lg">
            <ShieldAlert className="w-5 h-5" />
            ⚠️ SOS ACTIVE — Patient has activated emergency mode
          </div>
          {data.sosActivatedAt && (
            <p className="text-red-100 text-sm mt-1">
              Activated at {new Date(data.sosActivatedAt).toLocaleString()}
            </p>
          )}
        </div>
      )}

      <div className="max-w-lg mx-auto p-4 py-8 space-y-4">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <Heart className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">Emergency Health Card</p>
              <h1 className="text-2xl font-bold text-gray-900">{data.name}</h1>
              <p className="text-sm text-gray-500 font-mono">UHID: {data.uhid}</p>
            </div>
          </div>
        </div>

        {/* Blood Group — Big and visible */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <p className="text-sm text-gray-500 uppercase tracking-wide font-medium mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Blood Group
          </p>
          <div className="flex items-center gap-4">
            <div className={`w-20 h-20 rounded-2xl ${bloodGroupColors[data.bloodGroup] ?? 'bg-gray-400'} flex items-center justify-center shadow-lg`}>
              <span className="text-white text-2xl font-black">{formatBloodGroup(data.bloodGroup)}</span>
            </div>
            <div>
              <p className="text-3xl font-black text-gray-900">{formatBloodGroup(data.bloodGroup)}</p>
              <p className="text-gray-500 text-sm">Blood Type</p>
            </div>
          </div>
        </div>

        {/* Allergies */}
        {data.allergies.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-red-400">
            <p className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> ⚠ Known Allergies
            </p>
            <div className="flex flex-wrap gap-2">
              {data.allergies.map((a) => (
                <span key={a} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Chronic Conditions */}
        {data.chronicConditions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Known Conditions</p>
            <div className="flex flex-wrap gap-2">
              {data.chronicConditions.map((c) => (
                <span key={c} className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Current Medications */}
        {data.currentMedications.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Pill className="w-4 h-4" /> Current Medications
            </p>
            <ul className="space-y-1">
              {data.currentMedications.map((m) => (
                <li key={m} className="text-gray-700 text-sm flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" /> {m}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Emergency Contacts */}
        {data.emergencyContacts.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Phone className="w-4 h-4" /> Emergency Contacts
            </p>
            <div className="space-y-3">
              {data.emergencyContacts.map((c, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{c.name}</p>
                    <p className="text-sm text-gray-500">{c.relationship}</p>
                  </div>
                  <a
                    href={`tel:${c.phone}`}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl font-semibold text-sm hover:bg-green-600 transition-colors"
                  >
                    <Phone className="w-4 h-4" /> {c.phone}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 py-4">
          <p>UniHealth ID (UHID) Emergency Health Card</p>
          <p className="mt-1">This information is shared for emergency medical use only.</p>
        </div>
      </div>
    </div>
  );
}

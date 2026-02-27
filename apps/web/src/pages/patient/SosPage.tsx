import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldAlert, ShieldCheck, AlertTriangle, Loader2, Phone, MapPin, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';
import { Button } from '../../components/ui/button';

interface PatientProfile {
  uhid: string;
  firstName: string;
  isSosActive: boolean;
  sosActivatedAt: string | null;
  emergencyContacts: { name: string; phone: string; relationship: string; isPrimary: boolean }[];
}

export default function SosPage() {
  const queryClient = useQueryClient();
  const [confirmVisible, setConfirmVisible] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['patient-sos-profile'],
    queryFn: async () => {
      const res = await api.get('/api/v1/auth/me');
      return res.data.data as PatientProfile;
    },
  });

  const activateMutation = useMutation({
    mutationFn: () => api.post('/api/v1/emergency/sos'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-sos-profile'] });
      setConfirmVisible(false);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: () => api.delete('/api/v1/emergency/sos'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-sos-profile'] });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  const isSosActive = profile?.isSosActive ?? false;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto p-4 py-8 space-y-6">
        {/* Header */}
        <div>
          <Link to="/patient/dashboard" className="text-sm text-gray-500 hover:text-gray-700">← Back to Dashboard</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Emergency SOS</h1>
          <p className="text-gray-500 text-sm mt-1">Activate to share your emergency health info and alert your contacts</p>
        </div>

        {/* SOS Status Card */}
        {isSosActive ? (
          <div className="bg-red-600 rounded-2xl p-6 text-white text-center shadow-xl">
            <div className="w-20 h-20 rounded-full bg-red-500 border-4 border-red-300 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <ShieldAlert className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black mb-1">SOS IS ACTIVE</h2>
            {profile?.sosActivatedAt && (
              <p className="text-red-100 text-sm flex items-center justify-center gap-1 mb-4">
                <Clock className="w-3.5 h-3.5" /> Activated {new Date(profile.sosActivatedAt).toLocaleTimeString()}
              </p>
            )}
            <p className="text-red-100 text-sm mb-6">
              Your emergency contacts can see your health information. Nearby facilities have been alerted.
            </p>

            {/* Emergency info link */}
            {profile?.uhid && (
              <Link
                to={`/emergency/${profile.uhid}`}
                className="inline-block px-5 py-2.5 bg-white text-red-600 rounded-xl font-semibold text-sm mb-4 hover:bg-red-50 transition-colors"
              >
                View Your Emergency Card →
              </Link>
            )}

            <Button
              variant="outline"
              className="w-full bg-transparent border-white/40 text-white hover:bg-red-700 hover:text-white"
              onClick={() => deactivateMutation.mutate()}
              disabled={deactivateMutation.isPending}
            >
              {deactivateMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Deactivating…</>
              ) : (
                <><ShieldCheck className="w-4 h-4 mr-2" /> Deactivate SOS</>
              )}
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
            <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-12 h-12 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Emergency SOS</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
              Press to instantly share your critical health data with emergency responders and alert your contacts.
            </p>

            {!confirmVisible ? (
              <button
                onClick={() => setConfirmVisible(true)}
                className="w-full py-5 rounded-2xl bg-red-500 hover:bg-red-600 active:scale-95 text-white text-xl font-black shadow-lg shadow-red-200 transition-all"
              >
                🆘 ACTIVATE SOS
              </button>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-red-600 justify-center">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-semibold">Are you sure?</span>
                </div>
                <p className="text-sm text-red-500">This will alert your emergency contacts immediately.</p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setConfirmVisible(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => activateMutation.mutate()}
                    disabled={activateMutation.isPending}
                  >
                    {activateMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Activating…</>
                    ) : (
                      'Yes, Activate'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {activateMutation.isError && (
              <p className="text-red-500 text-sm mt-3">
                {activateMutation.error instanceof Error ? activateMutation.error.message : 'Activation failed'}
              </p>
            )}
          </div>
        )}

        {/* Emergency Contacts */}
        {profile?.emergencyContacts && profile.emergencyContacts.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Phone className="w-4 h-4 text-green-500" /> Emergency Contacts
            </h3>
            <div className="space-y-3">
              {profile.emergencyContacts.map((c, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-800">{c.name}</p>
                    <p className="text-sm text-gray-500">{c.relationship}</p>
                  </div>
                  <a
                    href={`tel:${c.phone}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" /> {c.phone}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QR Card Link */}
        {profile?.uhid && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-500" /> Emergency Health Card
            </h3>
            <p className="text-sm text-gray-500 mb-3">Share this link with emergency responders</p>
            <Link
              to={`/emergency/${profile.uhid}`}
              className="block w-full py-2.5 text-center bg-blue-50 text-blue-600 rounded-xl font-medium text-sm hover:bg-blue-100 transition-colors"
            >
              Open Emergency Card →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

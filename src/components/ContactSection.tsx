import React, { useState } from 'react';
import {
  MapPin,
  Phone,
  Mail,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Send,
} from 'lucide-react';
import { SocietySettings, UserProfile } from '../types/society';
import { submitContactMessage } from '../lib/firestoreService';

interface ContactSectionProps {
  settings: SocietySettings;
  userProfile: UserProfile | null;
  onRequireAuth: () => void;
  onExplore3D: () => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  settings,
  userProfile,
  onRequireAuth,
  onExplore3D,
}) => {
  const [name, setName] = useState(userProfile?.fullName || '');
  const [email, setEmail] = useState(userProfile?.email || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) {
      onRequireAuth();
      return;
    }
    if (message.trim().length < 5) {
      setFeedback({
        type: 'error',
        text: 'Please provide a message of at least 5 characters.',
      });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      await submitContactMessage({
        userId: userProfile.uid,
        name: name || userProfile.fullName,
        email: email || userProfile.email,
        phone,
        subject,
        message,
      });
      setSubject('');
      setMessage('');
      setFeedback({
        type: 'success',
        text: 'Your message has been logged in Firebase. Our concierge team will respond shortly.',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to send message.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact-section" className="py-20 bg-[#071827] border-t border-white/10">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left 6 Columns: Location, Master Plan Map & Configurable Contact Info */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <p className="text-xs font-medium tracking-widest uppercase text-[#22C55E] mb-2">
                Master Plan & Concierge Office
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white">
                Location & Contact
              </h2>
              <p className="text-slate-300 text-sm sm:text-base mt-2">
                Connect with the Green Valley Residencia management office for private site
                visits, plot documentation, or resident services.
              </p>
            </div>

            {/* Configurable Contact Details Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#0B1724] border border-white/10 rounded-xl p-5">
                <MapPin className="w-4 h-4 text-[#22C55E] mb-2" />
                <div className="text-xs text-slate-400">Society Office Address</div>
                <div className="text-xs font-medium text-white mt-1 leading-relaxed">
                  {settings.officeAddress}
                </div>
              </div>

              <div className="bg-[#0B1724] border border-white/10 rounded-xl p-5">
                <Phone className="w-4 h-4 text-[#22C55E] mb-2" />
                <div className="text-xs text-slate-400">Sales & Resident Desk</div>
                <div className="text-sm font-mono-tabular font-semibold text-white mt-1">
                  {settings.contactPhone}
                </div>
                <div className="text-xs text-slate-400 mt-1">Mon–Sun: 09:00 AM – 08:00 PM</div>
              </div>

              <div className="bg-[#0B1724] border border-white/10 rounded-xl p-5">
                <Mail className="w-4 h-4 text-[#22C55E] mb-2" />
                <div className="text-xs text-slate-400">Official Email</div>
                <div className="text-xs font-mono-tabular font-medium text-white mt-1 break-all">
                  {settings.contactEmail}
                </div>
              </div>

              <div className="bg-[#0B1724] border border-white/10 rounded-xl p-5">
                <ShieldAlert className="w-4 h-4 text-[#22C55E] mb-2" />
                <div className="text-xs text-slate-400">24/7 Gate Security Control</div>
                <div className="text-xs font-mono-tabular font-semibold text-[#22C55E] mt-1">
                  {settings.emergencyPhone}
                </div>
              </div>
            </div>

            {/* Interactive Society Master Sector Schematic Map */}
            <div className="bg-[#0B1724] border border-white/10 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Green Valley Residencia Master Sector Layout
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{settings.mapSectorNote}</p>
                </div>
                <button
                  type="button"
                  onClick={onExplore3D}
                  className="px-3 py-1.5 bg-[#22C55E]/15 text-[#22C55E] hover:bg-[#22C55E]/25 text-xs font-medium rounded-lg whitespace-nowrap"
                >
                  Open in 3D
                </button>
              </div>

              <svg
                viewBox="0 0 640 240"
                className="w-full h-48 rounded-lg bg-[#071827] border border-white/10"
              >
                {/* Boulevard Roads */}
                <rect x="20" y="95" width="600" height="50" fill="#1E293B" />
                <line
                  x1="25"
                  y1="120"
                  x2="615"
                  y2="120"
                  stroke="#22C55E"
                  strokeDasharray="8 6"
                  strokeWidth="1.5"
                />
                {/* Entrance Gate West */}
                <rect x="18" y="85" width="24" height="70" rx="4" fill="#22C55E" />
                <text x="50" y="124" fill="#F8FAFC" fontSize="11" fontWeight="600">
                  Gate 1 Security Checkpoint
                </text>

                {/* Sector A North */}
                <rect
                  x="60"
                  y="18"
                  width="250"
                  height="65"
                  rx="6"
                  fill="#0F2922"
                  stroke="#22C55E"
                  strokeWidth="1.2"
                />
                <text x="80" y="46" fill="#F8FAFC" fontSize="12" fontWeight="600">
                  Sector A — Royal 1 Kanal Enclave
                </text>
                <text x="80" y="64" fill="#94A3B8" fontSize="10">
                  Plots GV-101, GV-102 · North Boulevard
                </text>

                {/* Sector B North-East */}
                <rect
                  x="330"
                  y="18"
                  width="270"
                  height="65"
                  rx="6"
                  fill="#0F2922"
                  stroke="#22C55E"
                  strokeWidth="1.2"
                />
                <text x="350" y="46" fill="#F8FAFC" fontSize="12" fontWeight="600">
                  Sector B — 10 Marla Park View
                </text>
                <text x="350" y="64" fill="#94A3B8" fontSize="10">
                  Plots GV-103, GV-104 · Cypress Avenue
                </text>

                {/* Central Park & Gym */}
                <rect
                  x="230"
                  y="102"
                  width="220"
                  height="36"
                  rx="6"
                  fill="#15803D"
                />
                <text x="255" y="124" fill="#FFFFFF" fontSize="11" fontWeight="600">
                  Emerald Central Park & Fitness Club
                </text>

                {/* Sector C South */}
                <rect
                  x="60"
                  y="158"
                  width="540"
                  height="65"
                  rx="6"
                  fill="#0F2922"
                  stroke="#22C55E"
                  strokeWidth="1.2"
                />
                <text x="80" y="186" fill="#F8FAFC" fontSize="12" fontWeight="600">
                  Sector C — 5 Marla & 3 Marla Garden Walk
                </text>
                <text x="80" y="204" fill="#94A3B8" fontSize="10">
                  Plots GV-105, GV-106, GV-107, GV-108 · Olive Lane & Jasmine Crossway
                </text>
              </svg>
            </div>
          </div>

          {/* Right 6 Columns: Direct Contact Form */}
          <div className="lg:col-span-6 bg-[#0B1724] border border-white/10 rounded-xl p-6 sm:p-8">
            <h3 className="font-display text-2xl font-semibold text-white">
              Send a Direct Message
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-6">
              Have questions about house availability, society bylaws, or custom visits? Send us a
              message below.
            </p>

            {feedback && (
              <div
                className={`mb-5 p-3.5 rounded-lg border flex items-center gap-2 text-xs ${
                  feedback.type === 'success'
                    ? 'bg-[#22C55E]/15 border-[#22C55E]/40 text-[#4ADE80]'
                    : 'bg-red-500/15 border-red-500/40 text-red-300'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{feedback.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-3.5 py-2.5 bg-[#071827] border border-white/15 rounded-lg text-sm text-white focus:outline-none focus:border-[#22C55E]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    maxLength={150}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 bg-[#071827] border border-white/15 rounded-lg text-sm text-white focus:outline-none focus:border-[#22C55E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    maxLength={30}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+92 300 0000000"
                    className="w-full px-3.5 py-2.5 bg-[#071827] border border-white/15 rounded-lg text-sm text-white focus:outline-none focus:border-[#22C55E]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Subject *</label>
                  <input
                    type="text"
                    required
                    maxLength={150}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Property Inquiry / Private Tour"
                    className="w-full px-3.5 py-2.5 bg-[#071827] border border-white/15 rounded-lg text-sm text-white focus:outline-none focus:border-[#22C55E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Message *</label>
                <textarea
                  rows={4}
                  required
                  minLength={5}
                  maxLength={2000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your message here..."
                  className="w-full px-3.5 py-2.5 bg-[#071827] border border-white/15 rounded-lg text-sm text-white focus:outline-none focus:border-[#22C55E]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-6 bg-[#22C55E] hover:bg-[#4ADE80] disabled:opacity-50 text-[#071827] font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {submitting
                    ? 'Sending Message...'
                    : userProfile
                    ? 'Send Message'
                    : 'Sign In to Send Message'}
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

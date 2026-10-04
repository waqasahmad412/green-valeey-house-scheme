import React, { useState } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
} from 'firebase/auth';
import { Eye, EyeOff, X, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { auth, googleProvider, configureAuthPersistence } from '../lib/firebase';
import { ensureUserProfile } from '../lib/firestoreService';
import { GreenValleyLogo } from './Logo';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'signup';
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode,
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showProviderSetupGuide, setShowProviderSetupGuide] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      await configureAuthPersistence(rememberMe);
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user && result.user.email) {
        await ensureUserProfile(
          result.user.uid,
          result.user.email,
          result.user.displayName,
          result.user.phoneNumber || ''
        );
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/popup-closed-by-user') {
        setErrorMsg('Google sign-in popup was closed before completing authentication.');
      } else {
        setErrorMsg(
          err instanceof Error ? err.message : 'Google authentication failed.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (mode === 'reset') {
      if (!email.trim()) {
        setErrorMsg('Please enter your registered email address.');
        return;
      }
      setLoading(true);
      try {
        await sendPasswordResetEmail(auth, email.trim());
        setSuccessMsg(
          'Password reset email sent! Please check your inbox and spam folder.'
        );
      } catch (err: unknown) {
        setErrorMsg(
          err instanceof Error ? err.message : 'Failed to send password reset email.'
        );
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
      if (!acceptTerms) {
        setErrorMsg('Please accept the Green Valley Residencia Terms & Conditions.');
        return;
      }
    }

    setLoading(true);
    try {
      await configureAuthPersistence(rememberMe);
      if (mode === 'login') {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        if (cred.user.email) {
          await ensureUserProfile(
            cred.user.uid,
            cred.user.email,
            cred.user.displayName,
            phone
          );
        }
        onSuccess();
        onClose();
      } else {
        const cred = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        await updateProfile(cred.user, { displayName: fullName.trim() });
        try {
          await sendEmailVerification(cred.user);
        } catch {
          // Ignore verification email throttling
        }
        if (cred.user.email) {
          await ensureUserProfile(cred.user.uid, cred.user.email, fullName, phone);
        }
        onSuccess();
        onClose();
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/operation-not-allowed') {
        setShowProviderSetupGuide(true);
        setErrorMsg(
          'Email/Password sign-in is not yet enabled in your Firebase Console. You can sign in immediately with Google below, or enable Email/Password in Firebase Console -> Authentication -> Sign-in method.'
        );
      } else {
        setErrorMsg(
          err instanceof Error ? err.message : 'Authentication could not be completed.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-[#071827] border border-white/15 rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <GreenValleyLogo className="w-10 h-10 shrink-0" />
            <div>
              <h2 className="font-display text-2xl font-semibold text-white">
                {mode === 'login'
                  ? 'Welcome Back'
                  : mode === 'signup'
                  ? 'Create Resident Account'
                  : 'Reset Password'}
              </h2>
              <p className="text-xs text-slate-400">
                Green Valley Residencia Member Portal
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg"
            aria-label="Close authentication modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Official Google Sign-In Button */}
        {mode !== 'reset' && (
          <div className="mb-5">
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs rounded-lg flex items-center justify-center gap-3 transition-colors shadow-sm"
            >
              {/* Official Multicolor Google Logo SVG */}
              <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v2.98h3.86c2.26-2.09 3.56-5.17 3.56-8.8z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-2.98c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.27 14.31c-.24-.72-.38-1.49-.38-2.31s.14-1.59.38-2.31V6.6H1.29C.47 8.23 0 10.06 0 12s.47 3.77 1.29 5.4l3.98-3.09z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.6l3.98 3.09c.95-2.85 3.6-4.94 6.73-4.94z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative my-5 flex items-center justify-center">
              <div className="border-t border-white/10 w-full" />
              <span className="bg-[#071827] px-3 text-xs text-slate-400 whitespace-nowrap">
                or continue with email
              </span>
              <div className="border-t border-white/10 w-full" />
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {showProviderSetupGuide && (
          <div className="mb-4 p-3.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-white">
              <Info className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>How to Enable Email/Password in Firebase Console:</span>
            </div>
            <ol className="list-decimal list-inside space-y-0.5 text-slate-400">
              <li>Open Firebase Console for project gen-lang-client-0984217546</li>
              <li>Navigate to Authentication → Sign-in method</li>
              <li>Click &quot;Email/Password&quot;, toggle Enable, and click Save</li>
            </ol>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3.5 rounded-lg bg-[#22C55E]/15 border border-[#22C55E]/40 text-[#4ADE80] text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-3.5 py-2.5 bg-[#0B1724] border border-white/15 rounded-lg text-sm text-white focus:outline-none focus:border-[#22C55E]"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  maxLength={30}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+92 300 0000000"
                  className="w-full px-3.5 py-2.5 bg-[#0B1724] border border-white/15 rounded-lg text-sm text-white focus:outline-none focus:border-[#22C55E]"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs text-slate-300 mb-1">Email Address *</label>
            <input
              type="email"
              required
              maxLength={150}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3.5 py-2.5 bg-[#0B1724] border border-white/15 rounded-lg text-sm text-white focus:outline-none focus:border-[#22C55E]"
            />
          </div>

          {mode !== 'reset' && (
            <div>
              <label className="block text-xs text-slate-300 mb-1">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-[#0B1724] border border-white/15 rounded-lg text-sm text-white focus:outline-none focus:border-[#22C55E]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-xs text-slate-300 mb-1">
                Confirm Password *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-[#0B1724] border border-white/15 rounded-lg text-sm text-white focus:outline-none focus:border-[#22C55E]"
              />
            </div>
          )}

          {mode === 'login' && (
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="accent-[#22C55E] rounded"
                />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setMode('reset');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-[#22C55E] hover:underline"
              >
                Forgot password?
              </button>
            </div>
          )}

          {mode === 'signup' && (
            <label className="flex items-start gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="accent-[#22C55E] mt-0.5 rounded"
              />
              <span>
                I accept the Green Valley Residencia Community Bylaws, Privacy Policy, and
                Terms of Service.
              </span>
            </label>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-[#22C55E] hover:bg-[#4ADE80] disabled:opacity-50 text-[#071827] font-semibold text-xs rounded-lg transition-colors"
          >
            {loading
              ? 'Processing...'
              : mode === 'login'
              ? 'Login to Account'
              : mode === 'signup'
              ? 'Create Account'
              : 'Send Password Reset Email'}
          </button>
        </form>

        {/* Footer Switch Links */}
        <div className="mt-6 pt-4 border-t border-white/10 text-center text-xs text-slate-400">
          {mode === 'login' ? (
            <span>
              Don&apos;t have a resident account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg(null);
                }}
                className="text-[#22C55E] font-semibold hover:underline"
              >
                Sign Up
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                }}
                className="text-[#22C55E] font-semibold hover:underline"
              >
                Back to Login
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { apiRequest } from '../lib/api.ts';
import { ALGERIA_WILAYAS } from '../lib/algeria.ts';
import { Button, Input, Select } from '../components/ui/Primitives.tsx';

const DEMO_ACCOUNTS = [
  { role: 'ADMIN', email: 'admin@athar.dz', pass: 'Admin123!', ar: 'مدير المنصة', fr: 'Administrateur' },
  { role: 'PRODUCER', email: 'producer1@athar.dz', pass: 'Producer123!', ar: 'منتج 1 (البليدة)', fr: 'Producteur 1 (Blida)' },
  { role: 'PRODUCER', email: 'producer2@athar.dz', pass: 'Producer123!', ar: 'منتج 2 (الجزائر)', fr: 'Producteur 2 (Alger)' },
  { role: 'AMBASSADOR', email: 'ambassador@athar.dz', pass: 'Ambassador123!', ar: 'سفير SPG', fr: 'Ambassadeur SPG' },
  { role: 'CONSUMER', email: 'consumer1@athar.dz', pass: 'Consumer123!', ar: 'مستهلك 1 (الجزائر)', fr: 'Consommateur 1 (Alger)' },
  { role: 'CONSUMER', email: 'consumer2@athar.dz', pass: 'Consumer123!', ar: 'مستهلك 2 (وهران)', fr: 'Consommateur 2 (Oran)' },
];

export function AuthPage({ initialMode }: { initialMode: 'login' | 'register' | 'forgot' }) {
  const {
    locale,
    t,
    loginWithCredentials,
    registerAccount,
    loginWithGoogle,
    navigate,
    pushToast,
  } = useApp();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [wilaya, setWilaya] = useState('16 - Alger');
  const [role, setRole] = useState<'CONSUMER' | 'PRODUCER'>('CONSUMER');
  const [farmName, setFarmName] = useState('');
  const [farmNameFr, setFarmNameFr] = useState('');

  // Forgot/reset password state
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [tokenGenerated, setTokenGenerated] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await loginWithCredentials(email, password);
      pushToast(locale === 'ar' ? 'مرحباً بعودتك إلى أثر' : 'Bon retour sur Athar');
      navigate({ name: 'dashboard' });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await registerAccount({
        email,
        password,
        name,
        phone,
        wilaya,
        role,
        locale,
        farmName: role === 'PRODUCER' ? farmName : undefined,
        farmNameFr: role === 'PRODUCER' ? farmNameFr : undefined,
      });
      pushToast(
        locale === 'ar' ? 'تم إنشاء حسابك بنجاح' : 'Votre compte a été créé'
      );
      navigate({ name: 'dashboard' });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    setError('');
    try {
      await loginWithGoogle();
      pushToast(locale === 'ar' ? 'تم تسجيل الدخول عبر Google' : 'Connecté avec Google');
      navigate({ name: 'dashboard' });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google Sign-In failed');
    } finally {
      setBusy(false);
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await apiRequest<{
        mockResetToken?: string;
        messageAr: string;
        messageFr: string;
      }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      if (res.mockResetToken) {
        setTokenGenerated(res.mockResetToken);
        setResetToken(res.mockResetToken);
      }
      pushToast(locale === 'ar' ? res.messageAr : res.messageFr, 'info');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, token: resetToken, newPassword }),
      });
      pushToast(
        locale === 'ar'
          ? 'تم تحديث كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.'
          : 'Mot de passe mis à jour. Connectez-vous maintenant.'
      );
      setMode('login');
      setPassword(newPassword);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-[960px] px-4 sm:px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Auth Form Card */}
        <div className="lg:col-span-7 bg-white border border-[#E5E1D8] rounded-lg p-6 sm:p-8">
          <h1 className="font-editorial text-2xl text-[#17211C]">
            {mode === 'login'
              ? t.auth.loginTitle
              : mode === 'register'
                ? t.auth.registerTitle
                : t.auth.forgotTitle}
          </h1>

          {error && (
            <div className="mt-4 rounded-md border border-[#B91C1C]/35 bg-[#B91C1C]/5 p-3 text-xs text-[#991B1B]">
              {error}
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#52615A] mb-1">
                  {t.auth.email}
                </label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="consumer1@athar.dz"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#52615A] mb-1">
                  {t.auth.password}
                </label>
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={busy}>
                {t.auth.submitLogin}
              </Button>

              <div className="relative py-2 text-center text-xs text-[#7A8780]">
                <span className="bg-white px-2">
                  {locale === 'ar' ? 'أو' : 'ou'}
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full"
                disabled={busy}
                onClick={handleGoogle}
              >
                {t.auth.googleSignIn}
              </Button>

              <div className="pt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#52615A]">
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="hover:text-[#1B4D3E] hover:underline cursor-pointer"
                >
                  {t.auth.forgotLink}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="font-medium text-[#1B4D3E] hover:underline cursor-pointer"
                >
                  {t.auth.noAccount}
                </button>
              </div>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#52615A] mb-1.5">
                  {t.auth.accountType}
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-[#F2EFE9] rounded-md">
                  <button
                    type="button"
                    onClick={() => setRole('CONSUMER')}
                    className={`py-2 text-xs font-medium rounded transition-colors cursor-pointer ${
                      role === 'CONSUMER'
                        ? 'bg-white text-[#17211C] shadow-sm'
                        : 'text-[#52615A]'
                    }`}
                  >
                    {t.auth.consumer}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('PRODUCER')}
                    className={`py-2 text-xs font-medium rounded transition-colors cursor-pointer ${
                      role === 'PRODUCER'
                        ? 'bg-white text-[#17211C] shadow-sm'
                        : 'text-[#52615A]'
                    }`}
                  >
                    {t.auth.producer}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#52615A] mb-1">
                    {t.auth.name}
                  </label>
                  <Input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#52615A] mb-1">
                    {t.auth.phone}
                  </label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+213 55..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#52615A] mb-1">
                    {t.auth.email}
                  </label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#52615A] mb-1">
                    {t.auth.password}
                  </label>
                  <Input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#52615A] mb-1">
                  {t.auth.wilaya}
                </label>
                <Select
                  value={wilaya}
                  onChange={(e) => setWilaya(e.target.value)}
                >
                  {ALGERIA_WILAYAS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </Select>
              </div>

              {role === 'PRODUCER' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#F2EFE9]">
                  <div>
                    <label className="block text-xs font-medium text-[#52615A] mb-1">
                      {t.auth.farmName}
                    </label>
                    <Input
                      required
                      value={farmName}
                      onChange={(e) => setFarmName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#52615A] mb-1">
                      {t.auth.farmNameFr}
                    </label>
                    <Input
                      value={farmNameFr}
                      onChange={(e) => setFarmNameFr(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={busy}>
                {t.auth.submitRegister}
              </Button>

              <p className="text-center text-xs text-[#52615A]">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="font-medium text-[#1B4D3E] hover:underline cursor-pointer"
                >
                  {t.auth.hasAccount}
                </button>
              </p>
            </form>
          )}

          {mode === 'forgot' && (
            <div className="mt-6 space-y-5">
              <form onSubmit={handleRequestReset} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#52615A] mb-1">
                    {t.auth.email}
                  </label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <Button type="submit" variant="secondary" disabled={busy}>
                  <KeyRound className="w-4 h-4" />
                  <span>{t.auth.sendReset}</span>
                </Button>
              </form>

              {tokenGenerated && (
                <div className="rounded-md bg-[#F2EFE9] p-3 text-xs font-mono text-[#1B4D3E] break-all">
                  Mock Email Token: {tokenGenerated}
                </div>
              )}

              <form
                onSubmit={handleConfirmReset}
                className="pt-4 border-t border-[#E5E1D8] space-y-3"
              >
                <div>
                  <label className="block text-xs font-medium text-[#52615A] mb-1">
                    {t.auth.resetTokenLabel}
                  </label>
                  <Input
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#52615A] mb-1">
                    {t.auth.newPassword}
                  </label>
                  <Input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={busy}>
                  {t.auth.confirmReset}
                </Button>
              </form>

              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs font-medium text-[#1B4D3E] hover:underline cursor-pointer"
              >
                {t.auth.hasAccount}
              </button>
            </div>
          )}
        </div>

        {/* Quick Seeded Demo Credentials Panel */}
        <div className="lg:col-span-5 bg-[#F2EFE9]/80 border border-[#E5E1D8] rounded-lg p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#17211C]">
            <ShieldCheck className="w-4 h-4 text-[#1B4D3E]" aria-hidden="true" />
            <h2>{t.auth.quickDemoTitle}</h2>
          </div>
          <p className="mt-1.5 text-xs text-[#52615A]">
            {locale === 'ar'
              ? 'اضغط على أي حساب لملء بيانات الدخول تلقائياً وتجربة الصلاحيات المخصصة لكل دور.'
              : 'Cliquez sur un compte pour pré-remplir les identifiants et tester chaque rôle RBAC.'}
          </p>

          <div className="mt-4 divide-y divide-[#E5E1D8] border-y border-[#E5E1D8]">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => {
                  setMode('login');
                  setEmail(acc.email);
                  setPassword(acc.pass);
                }}
                className="w-full py-3 flex items-center justify-between gap-2 text-start hover:bg-white/60 px-2 rounded transition-colors cursor-pointer"
              >
                <div>
                  <p className="text-xs font-semibold text-[#17211C]">
                    {locale === 'ar' ? acc.ar : acc.fr}
                  </p>
                  <p className="text-[11px] font-mono text-[#52615A]">{acc.email}</p>
                </div>
                <span className="text-[11px] font-mono text-[#1B4D3E] shrink-0">
                  {acc.role}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

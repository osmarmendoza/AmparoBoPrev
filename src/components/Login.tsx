import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import { Logo } from './Logo';
import { signInWithEmailAndPassword, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Heart, Mail, Lock, AlertCircle, Info, Chrome } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('El inicio de sesión con Google no está habilitado en la consola de Firebase. Por favor, actívalo en Authentication > Sign-in method.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // "Forgot Password" or "Contact Admin" logic
        if (email === 'osmarmenva@gmail.com') {
           await sendPasswordResetEmail(auth, email);
           setMessage('Se ha enviado un enlace de recuperación a tu correo.');
        } else {
           // For other users, message saying they should contact the master
           setMessage('Por favor, contacta al administrador master (osmarmenva@gmail.com) para restablecer tu cuenta.');
        }
      }
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('El inicio de sesión con correo/contraseña no está habilitado en la consola de Firebase. Por favor, actívalo en Authentication > Sign-in method.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Left side - Branding */}
      <div className="md:w-[55%] bg-amparo-burgundy relative p-12 md:p-24 flex flex-col justify-end overflow-hidden">
        {/* Background Decorative Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-black/20 to-black/60 pointer-events-none"></div>
        
        {/* Faded Large Logo Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 scale-150 rotate-[-15deg] pointer-events-none">
          <Logo variant="light" className="w-[600px]" />
        </div>

        <div className="relative z-10 space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em]">PLATAFORMA DE GESTIÓN INTEGRAL</p>
          <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight">Amparo Bolivia Prevención</h1>
          <p className="text-lg text-white/70 max-w-md font-medium leading-relaxed">
            Seguimiento social, escolar y familiar para la protección integral de la niñez en Bolivia.
          </p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 bg-amparo-navy flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[440px] bg-white rounded-[32px] shadow-2xl p-10 md:p-12 animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center mb-10">
            <Logo variant="color" className="h-20 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Ingresar</h2>
            <p className="text-slate-400 mt-2 font-medium">Panel administrativo seguro</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 flex gap-3 items-start animate-in slide-in-from-top-2">
                <AlertCircle size={20} className="shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {message && (
              <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl border border-emerald-100 flex gap-3 items-start animate-in slide-in-from-top-2">
                <Info size={20} className="shrink-0" />
                <p className="text-sm font-medium">{message}</p>
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Correo electrónico</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-4 px-5 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                  placeholder="ejemplo@amparo.org"
                />
              </div>

              {isLogin && (
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-4 px-5 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary text-white py-4 rounded-xl font-bold text-base shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {loading && !isLogin ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                isLogin ? "Ingresar" : "Recuperar acceso"
              )}
            </button>

            {isLogin && (
              <>
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-slate-100"></div>
                  <span className="flex-shrink mx-4 text-[10px] font-bold text-slate-300 uppercase tracking-widest">O ingresar con</span>
                  <div className="flex-grow border-t border-slate-100"></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full bg-white border border-slate-200 text-slate-600 py-4 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                >
                  <Chrome size={20} className="text-brand-primary" />
                  Acceder con Google
                </button>
              </>
            )}

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setMessage('');
                }}
                className="text-sm font-semibold text-slate-400 hover:text-brand-primary transition-colors"
              >
                {isLogin ? "Olvidé mi contraseña" : "Volver al inicio"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

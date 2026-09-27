'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Network, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function LoginForm({ signupOpen = false }: { signupOpen?: boolean }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Por favor complete todos los campos');
      return;
    }
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        toast.error('Credenciales inválidas');
      } else {
        router.replace('/dashboard');
      }
    } catch {
      toast.error('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  // Misma línea que www.cedanet.net: fondo azul noche con cuadrícula, tarjeta blanca y cian de marca.
  // Colores fijos a propósito: esta pantalla no sigue el tema claro/oscuro del resto de la app.
  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center gap-6 px-4 py-8 bg-gradient-to-br from-[#0a1628] via-[#0d2137] to-[#0a2a3a]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-36 -top-40 h-[480px] w-[480px] rounded-full bg-[rgba(0,151,167,0.22)] blur-[80px]"
      />
      <div className="relative z-10 w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 bg-[#0097a7] rounded-xl flex items-center justify-center">
            <Network className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight text-white">RedCalc</h1>
            <p className="text-xs text-slate-400">Calculadora de Materiales</p>
          </div>
        </div>
        <div className="rounded-[1.25rem] border border-gray-200 bg-white text-gray-900 px-8 py-9 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.55)]">
          <div className="text-center mb-6">
            <h2 className="font-display text-xl font-bold tracking-tight text-gray-900">Iniciar Sesión</h2>
            <p className="mt-1 text-sm text-gray-600">Ingrese sus credenciales para continuar</p>
          </div>
          <div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">Correo electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    className="pl-10 h-11 rounded-xl border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus-visible:bg-white focus-visible:ring-[#0097a7]/30 focus-visible:border-[#0097a7]"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 rounded-xl border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus-visible:bg-white focus-visible:ring-[#0097a7]/30 focus-visible:border-[#0097a7]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-11 rounded-[0.6rem] bg-[#0097a7] font-semibold text-white hover:bg-[#00838f]" disabled={loading}>
                {loading ? 'Ingresando...' : 'Ingresar'}
              </Button>
            </form>
            {signupOpen && (
              <p className="mt-4 text-center text-sm text-gray-600">
                ¿No tiene cuenta?{' '}
                <Link href="/registro" className="font-semibold text-[#00838f] hover:underline">
                  Registrarse
                </Link>
              </p>
            )}
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-slate-400">
          Una herramienta de{' '}
          <a href="https://www.cedanet.net" target="_blank" rel="noopener" className="text-[#4dd0e1] hover:underline">
            Cedanet Solutions
          </a>
        </p>
      </div>
    </div>
  );
}

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import RegisterForm from './_components/register-form';
import { isSignupOpen } from '@/lib/signup';

export default async function RegisterPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect('/dashboard');
  if (!isSignupOpen()) redirect('/login');
  return <RegisterForm />;
}

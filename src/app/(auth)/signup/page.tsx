import { isPublicBeta } from '@/server/config';
import SignupForm from './SignupForm';

export const dynamic = 'force-dynamic';

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ convite?: string }>;
}) {
  const { convite } = await searchParams;
  return (
    <SignupForm
      inviteRequired={!isPublicBeta()}
      initialInvite={typeof convite === 'string' ? convite.slice(0, 64).toUpperCase() : ''}
    />
  );
}

import { setRequestLocale } from 'next-intl/server';
import ProfileClientContent from '@/components/ProfileClientContent';

export default async function ProfilePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ProfileClientContent />;
}

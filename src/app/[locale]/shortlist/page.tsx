import { setRequestLocale } from 'next-intl/server';
import ShortlistClientContent from '@/components/ShortlistClientContent';

export default async function ShortlistPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ShortlistClientContent />;
}

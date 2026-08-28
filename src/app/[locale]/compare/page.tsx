import { setRequestLocale } from 'next-intl/server';
import CompareClientContent from '@/components/CompareClientContent';

export default async function ComparePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <CompareClientContent />;
}

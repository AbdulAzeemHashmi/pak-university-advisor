import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { fetchUniversities, fetchScholarshipUniversities } from '@/lib/db';
import HomeClientContent from '@/components/HomeClientContent';

export default async function HomePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('hero');
  
  // Fetch top 6 universities for featured section
  const topData = await fetchUniversities({ page: 1, limit: 6 });
  const scholarshipUnis = await fetchScholarshipUniversities();

  return (
    <HomeClientContent
      featuredUnis={topData.results}
      totalUnis={topData.pagination.total}
      scholarshipCount={scholarshipUnis.length}
    />
  );
}

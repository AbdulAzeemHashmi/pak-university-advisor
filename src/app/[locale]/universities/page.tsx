import { setRequestLocale } from 'next-intl/server';
import { getAllUniqueCities, getAllUniquePrograms, getAllUniqueCategories } from '@/lib/db';
import UniversitiesSearchClient from '@/components/UniversitiesSearchClient';

export default async function UniversitiesPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  const sParams = searchParams ? await searchParams : {};

  setRequestLocale(locale);

  const cities = await getAllUniqueCities();
  const programs = await getAllUniquePrograms();
  const categories = await getAllUniqueCategories();

  const initialFilters = {
    searchQuery: typeof sParams.searchQuery === 'string' ? sParams.searchQuery : undefined,
    city: typeof sParams.city === 'string' ? sParams.city : undefined,
    province: typeof sParams.province === 'string' ? sParams.province : undefined,
    degree: typeof sParams.degree === 'string' ? sParams.degree : undefined,
    category: typeof sParams.category === 'string' ? sParams.category : undefined,
    distanceEducation: sParams.distanceEducation === 'true',
    maxFee: typeof sParams.maxFee === 'string' ? parseInt(sParams.maxFee, 10) : undefined,
    type: typeof sParams.type === 'string' ? (sParams.type as "Public" | "Private" | "all") : undefined,
    page: typeof sParams.page === 'string' ? parseInt(sParams.page, 10) : 1
  };

  return (
    <UniversitiesSearchClient
      cities={cities}
      programs={programs}
      categories={categories}
      initialFilters={initialFilters}
    />
  );
}

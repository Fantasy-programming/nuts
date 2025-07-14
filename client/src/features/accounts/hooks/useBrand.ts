import { useQuery } from '@tanstack/react-query';

type TBrandResult = {
  name: string;
  domain: string;
  icon: string;
};

interface UseBrandImageReturn {
  imageUrl: string | null;
  isLoading: boolean;
  error: string | null;
}

const fetchBrandImage = async (
  brandName: string,
  clientId: string
): Promise<string | null> => {
  if (!brandName.trim() || !clientId.trim()) return null;

  const url = `https://api.brandfetch.io/v2/search/${encodeURIComponent(
    brandName
  )}?c=${encodeURIComponent(clientId)}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: TBrandResult[] = await response.json();

  if (data.length > 0 && data[0].icon) {
    return data[0].icon;
  }

  throw new Error('No brand image found');
};

export const useBrandImage = (
  brandName: string,
  clientId: string
): UseBrandImageReturn => {
  const enabled = !!brandName.trim() && !!clientId.trim();

  const {
    data: imageUrl,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['brand-image', brandName, clientId],
    queryFn: () => fetchBrandImage(brandName, clientId),
    enabled,
    staleTime: 1000 * 60 * 60 * 24 * 7, // 7 days = data is considered fresh for 7 days
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days = keep in cache for 7 days
  });

  return {
    imageUrl: imageUrl ?? null,
    isLoading,
    error: error ? (error as Error).message : null,
  };
};


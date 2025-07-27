import { useQuery } from '@tanstack/react-query'
import { LocationFilters, PaginatedResponse, Location } from '@/types'

async function fetchLocations(filters: LocationFilters): Promise<PaginatedResponse<Location>> {
  const params = new URLSearchParams()
  
  if (filters.search) params.append('search', filters.search)
  if (filters.status) params.append('status', filters.status)
  if (filters.products?.length) params.append('products', filters.products.join(','))
  if (filters.dateRange) {
    params.append('startDate', filters.dateRange.start.toISOString())
    params.append('endDate', filters.dateRange.end.toISOString())
  }
  if (filters.expirationFilter) params.append('expirationFilter', filters.expirationFilter)

  const response = await fetch(`/api/locations?${params.toString()}`)
  if (!response.ok) {
    throw new Error('Failed to fetch locations')
  }
  
  return response.json()
}

export function useLocations(filters: LocationFilters) {
  return useQuery({
    queryKey: ['locations', filters],
    queryFn: () => fetchLocations(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
} 
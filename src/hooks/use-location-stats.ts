import { useQuery } from '@tanstack/react-query'
import { LocationStats } from '@/types'

async function fetchLocationStats(): Promise<LocationStats> {
  const response = await fetch('/api/locations/stats')
  if (!response.ok) {
    throw new Error('Failed to fetch location stats')
  }
  
  return response.json()
}

export function useLocationStats() {
  return useQuery({
    queryKey: ['location-stats'],
    queryFn: fetchLocationStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
} 
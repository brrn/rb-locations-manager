'use client'

import { useState } from 'react'
import { StatsCards } from './stats-cards'
import { SearchFilters } from './search-filters'
import { LocationGrid } from './location-grid'
import { AddLocationModal } from './add-location-modal'
import { SystemStatus } from './system-status'
import { useLocations } from '@/hooks/use-locations'
import { useLocationStats } from '@/hooks/use-location-stats'
import { LocationFilters } from '@/types'

export function Dashboard() {
  const [filters, setFilters] = useState<LocationFilters>({})
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const { data: stats } = useLocationStats()
  const { data: locations, isLoading } = useLocations(filters)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Location Management
          </h1>
          <p className="mt-2 text-gray-600">
            Manage Rare Brew's tea distribution locations
          </p>
        </div>

        {/* Stats Cards */}
        {stats && <StatsCards stats={stats} />}

        {/* Search and Filters */}
        <div className="mb-6">
          <SearchFilters
            filters={filters}
            onFiltersChange={setFilters}
            onAddLocation={() => setIsAddModalOpen(true)}
          />
        </div>

        {/* System Status */}
        <div className="mb-6">
          <SystemStatus />
        </div>

        {/* Location Grid */}
        <LocationGrid
          locations={locations?.data || []}
          isLoading={isLoading}
          onEditLocation={(location) => {
            // Handle edit
            console.log('Edit location:', location)
          }}
          onArchiveLocation={(location) => {
            // Handle archive
            console.log('Archive location:', location)
          }}
        />

        {/* Add Location Modal */}
        <AddLocationModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
      </div>
    </div>
  )
} 
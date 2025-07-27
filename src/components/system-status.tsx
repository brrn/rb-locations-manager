'use client'

import { useState } from 'react'
import { Activity, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'

export function SystemStatus() {
  const [isUpdating, setIsUpdating] = useState(false)

  // Mock data - in real app this would come from API
  const systemStatus = {
    shopifySync: {
      status: 'success' as const,
      lastUpdate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      message: 'Last sync completed successfully'
    },
    database: {
      status: 'success' as const,
      message: 'Database connection healthy'
    },
    geocoding: {
      status: 'success' as const,
      message: 'Geocoding service available'
    }
  }

  const handleManualUpdate = async () => {
    setIsUpdating(true)
    try {
      // Call the manual update API
      const response = await fetch('/api/system/update', {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Update failed')
      }
      
      // Refresh the page or update state
      window.location.reload()
    } catch (error) {
      console.error('Manual update failed:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      case 'warning':
        return 'text-yellow-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">System Status</h3>
        <button
          onClick={handleManualUpdate}
          disabled={isUpdating}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
          {isUpdating ? 'Updating...' : 'Update Now'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Shopify Sync Status */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          {getStatusIcon(systemStatus.shopifySync.status)}
          <div>
            <div className="text-sm font-medium text-gray-900">Shopify Sync</div>
            <div className={`text-xs ${getStatusColor(systemStatus.shopifySync.status)}`}>
              {systemStatus.shopifySync.message}
            </div>
            <div className="text-xs text-gray-500">
              {systemStatus.shopifySync.lastUpdate.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Database Status */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          {getStatusIcon(systemStatus.database.status)}
          <div>
            <div className="text-sm font-medium text-gray-900">Database</div>
            <div className={`text-xs ${getStatusColor(systemStatus.database.status)}`}>
              {systemStatus.database.message}
            </div>
          </div>
        </div>

        {/* Geocoding Status */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          {getStatusIcon(systemStatus.geocoding.status)}
          <div>
            <div className="text-sm font-medium text-gray-900">Geocoding</div>
            <div className={`text-xs ${getStatusColor(systemStatus.geocoding.status)}`}>
              {systemStatus.geocoding.message}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Activity</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Location "Downtown Coffee Shop" updated</span>
            <span className="text-gray-400">2 minutes ago</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Shopify sync completed - 15 new locations added</span>
            <span className="text-gray-400">2 hours ago</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span>3 locations expiring in 7 days</span>
            <span className="text-gray-400">1 day ago</span>
          </div>
        </div>
      </div>
    </div>
  )
} 
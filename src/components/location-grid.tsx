'use client'

import { Location } from '@/types'
import { MapPin, Calendar, User, Package, Edit, Archive } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface LocationGridProps {
  locations: Location[]
  isLoading: boolean
  onEditLocation: (location: Location) => void
  onArchiveLocation: (location: Location) => void
}

export function LocationGrid({ locations, isLoading, onEditLocation, onArchiveLocation }: LocationGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-4"></div>
            <div className="h-3 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  if (locations.length === 0) {
    return (
      <div className="text-center py-12">
        <MapPin className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No locations found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Try adjusting your search or filter criteria.
        </p>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800'
      case 'EXPIRED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getExpirationWarning = (expirationDate?: Date) => {
    if (!expirationDate) return null
    
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilExpiration <= 0) {
      return { text: 'Expired', color: 'text-red-600' }
    } else if (daysUntilExpiration <= 7) {
      return { text: `${daysUntilExpiration} days left`, color: 'text-red-600' }
    } else if (daysUntilExpiration <= 30) {
      return { text: `${daysUntilExpiration} days left`, color: 'text-yellow-600' }
    }
    
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {locations.map((location) => {
        const expirationWarning = getExpirationWarning(location.expirationDate)
        const address = location.address as any
        
        return (
          <div key={location.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {location.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(location.status)}`}>
                    {location.status}
                  </span>
                  {location.source === 'SHOPIFY' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Shopify
                    </span>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-1">
                <button
                  onClick={() => onEditLocation(location)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="Edit location"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onArchiveLocation(location)}
                  className="p-1 text-gray-400 hover:text-red-600"
                  title="Archive location"
                >
                  <Archive className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start gap-2 mb-3">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-600">
                <div>{address.street}</div>
                <div>{address.city}, {address.state} {address.zip}</div>
              </div>
            </div>

            {/* Contact */}
            {location.contact && (
              <div className="flex items-start gap-2 mb-3">
                <User className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-600">
                  <div>{(location.contact as any).name}</div>
                  {(location.contact as any).email && (
                    <div className="text-blue-600">{(location.contact as any).email}</div>
                  )}
                </div>
              </div>
            )}

            {/* Products */}
            {location.products && location.products.length > 0 && (
              <div className="flex items-start gap-2 mb-3">
                <Package className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-600">
                  <div className="font-medium">Products:</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {location.products.slice(0, 3).map((product) => (
                      <span key={product.id} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                        {product.name}
                      </span>
                    ))}
                    {location.products.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                        +{location.products.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Expiration */}
            {location.expirationDate && (
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div className="text-sm">
                  <span className="text-gray-600">Expires: </span>
                  <span className={expirationWarning?.color || 'text-gray-900'}>
                    {expirationWarning?.text || formatDistanceToNow(location.expirationDate, { addSuffix: true })}
                  </span>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="text-xs text-gray-500">
                Created {formatDistanceToNow(new Date(location.createdAt), { addSuffix: true })}
              </div>
              {location.salesChannel && (
                <span className="text-xs text-gray-500">
                  {location.salesChannel}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
} 
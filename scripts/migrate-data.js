#!/usr/bin/env node

/**
 * Data Migration Script
 * 
 * This script helps migrate data from the old system to the new Next.js system.
 * It reads the old JSON files and converts them to the new database format.
 */

const fs = require('fs').promises
const path = require('path')

// Mock Prisma client for migration
const mockPrisma = {
  location: {
    create: async (data) => {
      console.log('Creating location:', data.data.name)
      return { id: `mock-${Date.now()}`, ...data.data }
    },
    createMany: async (data) => {
      console.log('Creating many locations:', data.data.length)
      return { count: data.data.length }
    }
  },
  product: {
    create: async (data) => {
      console.log('Creating product:', data.data.name)
      return { id: `mock-${Date.now()}`, ...data.data }
    }
  }
}

async function migrateLocations() {
  try {
    console.log('Starting data migration...')

    // Read old location files
    const pendingLocationsPath = path.join(process.cwd(), 'pending-locations.json')
    const rejectedLocationsPath = path.join(process.cwd(), 'rejected-locations.json')

    let pendingLocations = []
    let rejectedLocations = []

    try {
      const pendingData = await fs.readFile(pendingLocationsPath, 'utf8')
      pendingLocations = JSON.parse(pendingData)
    } catch (error) {
      console.log('No pending locations file found')
    }

    try {
      const rejectedData = await fs.readFile(rejectedLocationsPath, 'utf8')
      rejectedLocations = JSON.parse(rejectedData)
    } catch (error) {
      console.log('No rejected locations file found')
    }

    console.log(`Found ${pendingLocations.length} pending locations`)
    console.log(`Found ${rejectedLocations.length} rejected locations`)

    // Convert and migrate pending locations
    for (const oldLocation of pendingLocations) {
      const newLocation = {
        name: oldLocation.name || 'Unknown Location',
        address: {
          street: oldLocation.address || '',
          city: oldLocation.city || '',
          state: oldLocation.state || '',
          zip: oldLocation.zip || '',
          country: oldLocation.country || 'US',
        },
        contact: {
          name: oldLocation.contactName || '',
          email: oldLocation.email || '',
          phone: oldLocation.phone || '',
        },
        status: 'ACTIVE',
        source: 'MANUAL',
        salesChannel: oldLocation.salesChannel || '',
        dealOwner: oldLocation.dealOwner || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await mockPrisma.location.create({ data: newLocation })
    }

    // Convert and migrate rejected locations (as archived)
    for (const oldLocation of rejectedLocations) {
      const newLocation = {
        name: oldLocation.name || 'Unknown Location',
        address: {
          street: oldLocation.address || '',
          city: oldLocation.city || '',
          state: oldLocation.state || '',
          zip: oldLocation.zip || '',
          country: oldLocation.country || 'US',
        },
        contact: {
          name: oldLocation.contactName || '',
          email: oldLocation.email || '',
          phone: oldLocation.phone || '',
        },
        status: 'ARCHIVED',
        source: 'MANUAL',
        archiveReason: 'Migrated from rejected locations',
        salesChannel: oldLocation.salesChannel || '',
        dealOwner: oldLocation.dealOwner || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        archivedAt: new Date(),
      }

      await mockPrisma.location.create({ data: newLocation })
    }

    console.log('Migration completed successfully!')
    console.log('Note: This was a dry run. To actually migrate data, replace mockPrisma with real Prisma client.')

  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateLocations()
}

module.exports = { migrateLocations } 
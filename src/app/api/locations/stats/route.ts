import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get counts for different statuses
    const [total, active, archived, expired] = await Promise.all([
      prisma.location.count(),
      prisma.location.count({ where: { status: 'ACTIVE' } }),
      prisma.location.count({ where: { status: 'ARCHIVED' } }),
      prisma.location.count({ where: { status: 'EXPIRED' } }),
    ])

    // Get expiring soon count (30 days)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    
    const expiringSoon = await prisma.location.count({
      where: {
        status: 'ACTIVE',
        expirationDate: {
          lte: thirtyDaysFromNow,
          gte: new Date(),
        },
      },
    })

    return NextResponse.json({
      total,
      active,
      archived,
      expired,
      expiringSoon,
    })
  } catch (error) {
    console.error('Error fetching location stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
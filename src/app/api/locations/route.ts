import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { LocationFilters } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const products = searchParams.get('products')?.split(',')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const expirationFilter = searchParams.get('expirationFilter')

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { path: ['street'], string_contains: search } },
        { address: { path: ['city'], string_contains: search } },
        { contact: { path: ['name'], string_contains: search } },
        { contact: { path: ['email'], string_contains: search } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    if (expirationFilter === 'expiring') {
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      where.expirationDate = {
        lte: thirtyDaysFromNow,
        gte: new Date(),
      }
    } else if (expirationFilter === 'expired') {
      where.expirationDate = {
        lt: new Date(),
      }
    }

    // Get total count
    const total = await prisma.location.count({ where })

    // Get locations with pagination
    const locations = await prisma.location.findMany({
      where,
      include: {
        locationProducts: {
          include: {
            product: true,
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    // Filter by products if specified
    let filteredLocations = locations
    if (products?.length) {
      filteredLocations = locations.filter(location =>
        location.locationProducts.some(lp =>
          products.includes(lp.product.sku)
        )
      )
    }

    return NextResponse.json({
      data: filteredLocations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching locations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, address, contact, products, salesChannel, dealOwner, expirationDate } = body

    // Create location
    const location = await prisma.location.create({
      data: {
        name,
        address,
        contact,
        salesChannel,
        dealOwner,
        expirationDate: expirationDate ? new Date(expirationDate) : null,
        source: 'MANUAL',
        status: 'ACTIVE',
      },
    })

    // Add product relationships
    if (products?.length) {
      await prisma.locationProduct.createMany({
        data: products.map((productId: string) => ({
          locationId: location.id,
          productId,
        })),
      })
    }

    // Log the action
    await prisma.locationHistory.create({
      data: {
        locationId: location.id,
        action: 'CREATE',
        userId: session.user.id,
        changes: { ...body },
      },
    })

    return NextResponse.json({ data: location }, { status: 201 })
  } catch (error) {
    console.error('Error creating location:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
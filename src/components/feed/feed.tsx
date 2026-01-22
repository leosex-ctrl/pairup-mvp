'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { NewPairingModal } from '@/components/pairing/new-pairing-modal'
import { FeedCard } from '@/components/feed/feed-card'
import { FilterBar } from '@/components/feed/filter-bar'

interface Like {
  user_id: string
  pairing_id: string
}

interface Pairing {
  id: string
  image_url: string
  food_name: string | null
  beverage_type: string | null
  flavor_principle: string | null
  beverage_brand: string | null
  food_brand: string | null
  rating: string
  created_at: string
  user_id: string
  profiles: {
    username: string | null
    avatar_url: string | null
  } | null
  likes: Like[]
}

export function Feed() {
  const [pairings, setPairings] = useState<Pairing[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [selectedBeverage, setSelectedBeverage] = useState('all')
  const [selectedPrinciple, setSelectedPrinciple] = useState('all')

  const supabase = createClient()

  // Fetch current user on mount
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    getCurrentUser()
  }, [])

  useEffect(() => {
    fetchPairings()
  }, [selectedBeverage, selectedPrinciple])

  const fetchPairings = async () => {
    setIsLoading(true)

    // Debug logs
    console.log('Filter - Beverage:', selectedBeverage)
    console.log('Filter - Principle:', selectedPrinciple)

    let query = supabase
      .from('pairings')
      .select('*, profiles(username, avatar_url), likes(user_id, pairing_id)')
      .order('created_at', { ascending: false })
      .limit(50)

    // Apply beverage filter (case-insensitive with fuzzy matching)
    if (selectedBeverage !== 'all') {
      const beverageFilter = selectedBeverage.trim()
      console.log('Applying beverage filter:', beverageFilter)

      // Handle non-alcoholic which maps to multiple values
      if (beverageFilter === 'non-alcoholic') {
        query = query.or('beverage_type.ilike.%na-%,beverage_type.ilike.%mocktail%')
      } else {
        query = query.ilike('beverage_type', `%${beverageFilter}%`)
      }
    }

    // Apply flavor principle filter
    if (selectedPrinciple !== 'all') {
      const principleFilter = selectedPrinciple.trim()
      console.log('Applying principle filter:', principleFilter)
      query = query.ilike('flavor_principle', `%${principleFilter}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching pairings:', error)
    } else {
      setPairings((data as Pairing[]) || [])
    }

    setIsLoading(false)
    setIsInitialLoad(false)
  }

  const handleLikeUpdate = (pairingId: string, newLikes: Like[]) => {
    setPairings(prev => prev.map(p =>
      p.id === pairingId ? { ...p, likes: newLikes } : p
    ))
  }

  const handleBeverageChange = (value: string) => {
    setSelectedBeverage(value)
  }

  const handlePrincipleChange = (value: string) => {
    setSelectedPrinciple(value)
  }

  const hasActiveFilters = selectedBeverage !== 'all' || selectedPrinciple !== 'all'

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <FilterBar
        selectedBeverage={selectedBeverage}
        selectedPrinciple={selectedPrinciple}
        onBeverageChange={handleBeverageChange}
        onPrincipleChange={handlePrincipleChange}
      />

      {/* Initial Loading State - show skeleton */}
      {isInitialLoad ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden animate-pulse">
              <div className="aspect-square bg-muted" />
              <CardContent className="p-4 space-y-3">
                <div className="h-5 bg-muted rounded w-3/4" />
                <div className="flex gap-2">
                  <div className="h-5 bg-muted rounded w-16" />
                  <div className="h-5 bg-muted rounded w-20" />
                </div>
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !isLoading && pairings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            {hasActiveFilters ? (
              <>
                <p className="text-muted-foreground mb-4">
                  No pairings found with these filters.
                </p>
                <button
                  onClick={() => {
                    setSelectedBeverage('all')
                    setSelectedPrinciple('all')
                  }}
                  className="text-primary hover:underline"
                >
                  Clear filters
                </button>
              </>
            ) : (
              <>
                <p className="text-muted-foreground mb-4">
                  No pairings yet. Be the first to share!
                </p>
                <NewPairingModal />
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Results count with loading indicator */}
          <div className="flex items-center gap-2">
            {isLoading && (
              <svg className="animate-spin h-4 w-4 text-muted-foreground" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {hasActiveFilters && !isLoading && (
              <p className="text-sm text-muted-foreground">
                Showing {pairings.length} pairing{pairings.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Pairings Grid */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ${isLoading ? 'opacity-50' : ''}`}>
            {pairings.map((pairing) => (
              <FeedCard
                key={pairing.id}
                pairing={pairing}
                currentUserId={currentUserId}
                onLikeUpdate={handleLikeUpdate}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

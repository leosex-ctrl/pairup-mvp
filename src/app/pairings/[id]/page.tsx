'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { BEVERAGE_TYPES } from '@/lib/validations/pairing'
import { CommentSection } from '@/components/pairing/comment-section'
import { AiReview } from '@/components/pairing/ai-review'
import { RealityCheck } from '@/components/pairing/reality-check'

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
  review_text: string | null
  beverage_brand: string | null
  food_brand: string | null
  reality_score: number | null
  rating: string
  created_at: string
  user_id: string
  profiles: {
    username: string | null
    avatar_url: string | null
  } | null
  likes: Like[]
}

const FLAVOR_BADGE_COLORS: Record<string, string> = {
  'Acid + Umami': 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200',
  'Sweet + Spicy': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'Fat + Tannin': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'Bitter + Sweet': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  'Effervescence + Fried': 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200',
  'Complement': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  'Contrast': 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
}

export default function PairingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [pairing, setPairing] = useState<Pairing | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLiking, setIsLiking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()
  const pairingId = params.id as string

  useEffect(() => {
    const fetchData = async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)

      // Fetch pairing
      const { data, error } = await supabase
        .from('pairings')
        .select('*, profiles(username, avatar_url), likes(user_id, pairing_id)')
        .eq('id', pairingId)
        .single()

      if (error) {
        console.error('Error fetching pairing:', error)
        setError('Pairing not found')
      } else {
        setPairing(data as Pairing)
      }

      setIsLoading(false)
    }

    fetchData()
  }, [pairingId])

  const getBeverageLabel = (type: string | null, brand: string | null = null) => {
    const typeLabel = type
      ? BEVERAGE_TYPES.find(t => t.value.toLowerCase() === type.toLowerCase())?.label || type
      : 'Unknown'

    // If brand is available, show "Brand (Type)" format
    if (brand) {
      return `${brand} (${typeLabel})`
    }
    return typeLabel
  }

  const getFlavorBadgeColor = (principle: string | null) => {
    if (!principle) return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    return FLAVOR_BADGE_COLORS[principle] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  }

  const likes = pairing?.likes || []
  const likesCount = likes.length
  const userHasLiked = currentUserId ? likes.some(like => like.user_id === currentUserId) : false

  const handleToggleLike = async () => {
    if (!currentUserId || !pairing || isLiking) return

    setIsLiking(true)

    // Optimistic update
    const optimisticLikes = userHasLiked
      ? likes.filter(like => like.user_id !== currentUserId)
      : [...likes, { user_id: currentUserId, pairing_id: pairing.id }]

    setPairing({ ...pairing, likes: optimisticLikes })

    try {
      if (userHasLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', currentUserId)
          .eq('pairing_id', pairing.id)

        if (error) {
          console.error('Error unliking:', error)
          setPairing({ ...pairing, likes })
        }
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({
            user_id: currentUserId,
            pairing_id: pairing.id,
          })

        if (error) {
          console.error('Error liking:', error)
          setPairing({ ...pairing, likes })
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      setPairing({ ...pairing, likes })
    } finally {
      setIsLiking(false)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-background to-muted">
        <div className="max-w-4xl mx-auto p-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-24" />
            <div className="aspect-[4/3] bg-muted rounded-xl" />
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="h-6 bg-muted rounded w-1/2" />
              <div className="h-20 bg-muted rounded" />
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (error || !pairing) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-background to-muted">
        <div className="max-w-4xl mx-auto p-4">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">{error || 'Pairing not found'}</p>
              <Link href="/feed">
                <Button>Back to Feed</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="max-w-4xl mx-auto p-4">
        {/* Back Button */}
        <Link
          href="/feed"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Feed
        </Link>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="relative">
            <div className="aspect-square lg:aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={pairing.image_url}
                alt={pairing.food_name || 'Food pairing'}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            {/* Title & Beverage */}
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {pairing.food_brand
                  ? `${pairing.food_brand} ${pairing.food_name || ''}`
                  : pairing.food_name || 'Untitled Pairing'}
              </h1>
              <p className="text-xl text-muted-foreground">
                Paired with <span className="text-foreground font-medium">{getBeverageLabel(pairing.beverage_type, pairing.beverage_brand)}</span>
              </p>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-3">
              {/* Beverage Badge */}
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-primary/10 text-primary">
                {getBeverageLabel(pairing.beverage_type, pairing.beverage_brand)}
              </span>

              {/* Flavor Principle Badge */}
              {pairing.flavor_principle && (
                <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getFlavorBadgeColor(pairing.flavor_principle)}`}>
                  {pairing.flavor_principle}
                </span>
              )}

              {/* Rating Badge */}
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-800">
                {pairing.rating === 'up' ? '👍 Recommended' : '👎 Not Recommended'}
              </span>
            </div>

            {/* Review Text */}
            {pairing.review_text && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">Tasting Notes</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {pairing.review_text}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Author Info */}
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
              <Avatar className="h-12 w-12">
                <AvatarImage src={pairing.profiles?.avatar_url || undefined} />
                <AvatarFallback>
                  {pairing.profiles?.username?.charAt(0).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">@{pairing.profiles?.username || 'anonymous'}</p>
                <p className="text-sm text-muted-foreground">
                  Posted on {new Date(pairing.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {/* Like Button */}
            <div className="flex items-center gap-4">
              <Button
                variant={userHasLiked ? 'default' : 'outline'}
                size="lg"
                onClick={handleToggleLike}
                disabled={!currentUserId || isLiking}
                className={`gap-2 ${userHasLiked ? 'bg-red-500 hover:bg-red-600 text-white' : ''}`}
              >
                {userHasLiked ? (
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                )}
                {likesCount} {likesCount === 1 ? 'Like' : 'Likes'}
              </Button>

              <Button variant="outline" size="lg" className="gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </Button>

              {/* Find Nearby Button - only show if beverage is detected */}
              {pairing.beverage_type && pairing.beverage_type !== 'None detected' && (
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2"
                  onClick={() => {
                    const query = pairing.beverage_brand
                      ? `${pairing.beverage_brand} ${pairing.beverage_type} near me`
                      : `${pairing.beverage_type} near me`
                    const encodedQuery = encodeURIComponent(query)
                    window.open(`https://www.google.com/search?tbm=shop&q=${encodedQuery}`, '_blank')
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Find Nearby
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* AI Review Section */}
        <div className="mt-8">
          <AiReview
            reviewText={pairing.review_text}
            flavorPrinciple={pairing.flavor_principle}
          />

          {/* Reality Check */}
          <RealityCheck
            pairingId={pairingId}
            authorId={pairing.user_id}
            currentUserId={currentUserId}
            initialScore={pairing.reality_score}
            onScoreUpdate={(score) => setPairing({ ...pairing, reality_score: score })}
          />
        </div>

        {/* Comments Section */}
        <div className="mt-8">
          <CommentSection pairingId={pairingId} />
        </div>
      </div>
    </main>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { BEVERAGE_TYPES } from '@/lib/validations/pairing'

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

interface FeedCardProps {
  pairing: Pairing
  currentUserId: string | null
  onLikeUpdate: (pairingId: string, newLikes: Like[]) => void
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

export function FeedCard({ pairing, currentUserId, onLikeUpdate }: FeedCardProps) {
  const [isLiking, setIsLiking] = useState(false)
  const supabase = createClient()

  const likes = pairing.likes || []
  const likesCount = likes.length
  const userHasLiked = currentUserId ? likes.some(like => like.user_id === currentUserId) : false

  const getBeverageLabel = (type: string | null, brand: string | null) => {
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

  const handleToggleLike = async () => {
    if (!currentUserId || isLiking) return

    setIsLiking(true)

    // Optimistic update
    const optimisticLikes = userHasLiked
      ? likes.filter(like => like.user_id !== currentUserId)
      : [...likes, { user_id: currentUserId, pairing_id: pairing.id }]

    onLikeUpdate(pairing.id, optimisticLikes)

    try {
      if (userHasLiked) {
        // Unlike: delete from likes
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', currentUserId)
          .eq('pairing_id', pairing.id)

        if (error) {
          console.error('Error unliking:', error)
          // Revert on error
          onLikeUpdate(pairing.id, likes)
        }
      } else {
        // Like: insert into likes
        const { error } = await supabase
          .from('likes')
          .insert({
            user_id: currentUserId,
            pairing_id: pairing.id,
          })

        if (error) {
          console.error('Error liking:', error)
          // Revert on error
          onLikeUpdate(pairing.id, likes)
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      // Revert on error
      onLikeUpdate(pairing.id, likes)
    } finally {
      setIsLiking(false)
    }
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Pairing Image */}
      <Link href={`/pairings/${pairing.id}`} className="block relative aspect-square group">
        <img
          src={pairing.image_url}
          alt={pairing.food_name || 'Food pairing'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </Link>

      {/* Pairing Info */}
      <CardContent className="p-4">
        {/* Food Name */}
        <Link href={`/pairings/${pairing.id}`} className="block hover:text-primary transition-colors">
          <h3 className="font-semibold text-lg mb-2 line-clamp-1">
            {pairing.food_brand
              ? `${pairing.food_brand} ${pairing.food_name || ''}`
              : pairing.food_name || 'Untitled Pairing'}
          </h3>
        </Link>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {/* Beverage Type Badge */}
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
            {getBeverageLabel(pairing.beverage_type, pairing.beverage_brand)}
          </span>

          {/* Flavor Principle Badge */}
          {pairing.flavor_principle && (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFlavorBadgeColor(pairing.flavor_principle)}`}>
              {pairing.flavor_principle}
            </span>
          )}
        </div>

        {/* Like Button and Meta */}
        <div className="flex items-center justify-between">
          {/* Like Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleLike}
            disabled={!currentUserId || isLiking}
            className={`gap-1.5 px-2 ${userHasLiked ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {userHasLiked ? (
              // Filled heart
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            ) : (
              // Outline heart
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            )}
            <span className="text-sm font-medium">{likesCount}</span>
          </Button>

          {/* Meta info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Avatar className="h-5 w-5">
              <AvatarImage src={pairing.profiles?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {pairing.profiles?.username?.charAt(0).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <span>@{pairing.profiles?.username ?? 'anonymous'}</span>
            <span>·</span>
            <span>{new Date(pairing.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

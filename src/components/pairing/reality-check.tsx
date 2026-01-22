'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface RealityCheckProps {
  pairingId: string
  authorId: string
  currentUserId: string | null
  initialScore: number | null
  onScoreUpdate?: (score: number) => void
}

export function RealityCheck({
  pairingId,
  authorId,
  currentUserId,
  initialScore,
  onScoreUpdate,
}: RealityCheckProps) {
  const [score, setScore] = useState<number | null>(initialScore)
  const [hoveredScore, setHoveredScore] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()
  const isAuthor = currentUserId === authorId

  const handleRatingClick = async (newScore: number) => {
    if (!isAuthor || isSubmitting) return

    setIsSubmitting(true)
    setError(null)
    setShowSaved(false)

    // Optimistic update
    const previousScore = score
    setScore(newScore)

    try {
      const { error } = await supabase
        .from('pairings')
        .update({ reality_score: newScore })
        .eq('id', pairingId)

      if (error) {
        console.error('Error updating reality score:', error)
        setError('Failed to save rating')
        setScore(previousScore) // Revert
      } else {
        onScoreUpdate?.(newScore)
        // Show saved feedback
        setShowSaved(true)
        setTimeout(() => setShowSaved(false), 2000)
      }
    } catch (err) {
      console.error('Error updating reality score:', err)
      setError('Failed to save rating')
      setScore(previousScore) // Revert
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get visitor badge based on score
  const getVisitorBadge = (ratingScore: number | null) => {
    if (ratingScore === null) {
      return {
        icon: null,
        text: 'Waiting for taster verdict...',
        className: 'text-muted-foreground',
        pulse: true,
      }
    }
    if (ratingScore >= 4) {
      return {
        icon: '✅',
        text: 'Verified Match',
        className: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
        pulse: false,
      }
    }
    if (ratingScore === 3) {
      return {
        icon: '😐',
        text: 'Neutral',
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
        pulse: false,
      }
    }
    // Score 1-2
    return {
      icon: '⚠️',
      text: 'Taster Rejected',
      className: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200',
      pulse: false,
    }
  }

  // Author view - can rate with stars
  if (isAuthor) {
    return (
      <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 rounded-xl border border-yellow-200 dark:border-yellow-800">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🧪</span>
          <div className="flex-1">
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
              Reality Check
            </h4>
            <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
              Did the taste match the theory? Rate your experience!
            </p>

            {/* Star Rating Interface */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((starValue) => (
                <button
                  key={starValue}
                  onClick={() => handleRatingClick(starValue)}
                  onMouseEnter={() => setHoveredScore(starValue)}
                  onMouseLeave={() => setHoveredScore(null)}
                  disabled={isSubmitting}
                  className={`
                    text-3xl p-1 rounded-lg transition-all duration-200
                    ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-110'}
                  `}
                  title={`${starValue} star${starValue > 1 ? 's' : ''}`}
                >
                  {(hoveredScore !== null ? starValue <= hoveredScore : starValue <= (score || 0))
                    ? '⭐'
                    : '☆'}
                </button>
              ))}

              {/* Saved feedback */}
              {showSaved && (
                <span className="ml-2 text-green-600 dark:text-green-400 text-sm font-medium flex items-center gap-1 animate-in fade-in duration-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Saved!
                </span>
              )}
            </div>

            {/* Score label */}
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 h-5">
              {hoveredScore
                ? `Rate ${hoveredScore}/5`
                : score
                  ? `Your verdict: ${score}/5 stars`
                  : 'Click to rate your experience'
              }
            </p>

            {error && (
              <p className="text-sm text-red-600 mt-2">{error}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Visitor view - read only with colored badges
  const badge = getVisitorBadge(score)

  return (
    <div className="mt-6 p-4 bg-muted/50 rounded-xl">
      <div className="flex items-start gap-3">
        <span className="text-2xl">🧪</span>
        <div>
          <h4 className="font-semibold mb-2">Reality Check</h4>
          {score !== null ? (
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${badge.className}`}>
              {badge.icon} {badge.text}
              <span className="opacity-75">({score}/5)</span>
            </span>
          ) : (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              {badge.text}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

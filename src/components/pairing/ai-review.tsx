'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AiReviewProps {
  reviewText: string | null
  flavorPrinciple: string | null
}

const FLAVOR_EXPLANATIONS: Record<string, { description: string; icon: string }> = {
  'Acid + Umami': {
    description: 'The bright acidity cuts through rich, savory umami flavors, creating a balanced and refreshing pairing.',
    icon: '🍋',
  },
  'Sweet + Spicy': {
    description: 'Sweetness tames the heat while spice adds complexity, resulting in a dynamic flavor dance.',
    icon: '🌶️',
  },
  'Fat + Tannin': {
    description: 'Tannins cleanse the palate of rich fats, making each bite feel as indulgent as the first.',
    icon: '🍷',
  },
  'Bitter + Sweet': {
    description: 'Bitterness and sweetness balance each other out, creating depth and sophistication.',
    icon: '☕',
  },
  'Effervescence + Fried': {
    description: 'Bubbles scrub away oil and grease, keeping fried foods feeling light and crisp.',
    icon: '🫧',
  },
  'Complement': {
    description: 'Similar flavor profiles amplify each other, creating a harmonious and unified taste experience.',
    icon: '🎵',
  },
  'Contrast': {
    description: 'Opposing flavors create excitement and intrigue, with each element highlighting the other.',
    icon: '⚡',
  },
}

const FLAVOR_BADGE_COLORS: Record<string, string> = {
  'Acid + Umami': 'bg-lime-100 text-lime-800 border-lime-300 dark:bg-lime-900/50 dark:text-lime-200 dark:border-lime-700',
  'Sweet + Spicy': 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/50 dark:text-orange-200 dark:border-orange-700',
  'Fat + Tannin': 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/50 dark:text-purple-200 dark:border-purple-700',
  'Bitter + Sweet': 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/50 dark:text-amber-200 dark:border-amber-700',
  'Effervescence + Fried': 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-900/50 dark:text-sky-200 dark:border-sky-700',
  'Complement': 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-200 dark:border-emerald-700',
  'Contrast': 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/50 dark:text-rose-200 dark:border-rose-700',
}

export function AiReview({ reviewText, flavorPrinciple }: AiReviewProps) {
  const flavorInfo = flavorPrinciple ? FLAVOR_EXPLANATIONS[flavorPrinciple] : null
  const badgeColor = flavorPrinciple
    ? FLAVOR_BADGE_COLORS[flavorPrinciple] || 'bg-gray-100 text-gray-800 border-gray-300'
    : null

  return (
    <Card className="overflow-hidden border-2 border-primary/20">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-4">
        <CardTitle className="flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <span>AI Sommelier&apos;s Notes</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Review Text */}
        <div>
          {reviewText ? (
            <p className="text-foreground leading-relaxed text-lg">
              &ldquo;{reviewText}&rdquo;
            </p>
          ) : (
            <p className="text-muted-foreground italic">
              No detailed analysis available for this pairing.
            </p>
          )}
        </div>

        {/* Flavor Principle Section */}
        {flavorPrinciple && flavorInfo && (
          <div className={`p-4 rounded-xl border-2 ${badgeColor}`}>
            <div className="flex items-start gap-3">
              <span className="text-3xl">{flavorInfo.icon}</span>
              <div>
                <h4 className="font-bold text-lg mb-1">
                  {flavorPrinciple}
                </h4>
                <p className="text-sm opacity-90">
                  {flavorInfo.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-muted-foreground">
            Analysis powered by AI. Pairing recommendations are suggestions based on flavor science principles.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

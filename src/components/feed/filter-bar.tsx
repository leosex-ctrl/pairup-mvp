'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const BEVERAGE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'wine', label: 'Wine' },
  { value: 'beer', label: 'Beer' },
  { value: 'cocktails', label: 'Cocktails' },
  { value: 'non-alcoholic', label: 'Non-Alcoholic' },
] as const

const FLAVOR_PRINCIPLES = [
  { value: 'all', label: 'All Principles' },
  { value: 'Acid + Umami', label: 'Acid + Umami' },
  { value: 'Sweet + Spicy', label: 'Sweet + Spicy' },
  { value: 'Fat + Tannin', label: 'Fat + Tannin' },
  { value: 'Bitter + Sweet', label: 'Bitter + Sweet' },
  { value: 'Effervescence + Fried', label: 'Effervescence + Fried' },
  { value: 'Complement', label: 'Complement' },
  { value: 'Contrast', label: 'Contrast' },
] as const

interface FilterBarProps {
  selectedBeverage: string
  selectedPrinciple: string
  onBeverageChange: (value: string) => void
  onPrincipleChange: (value: string) => void
}

export function FilterBar({
  selectedBeverage,
  selectedPrinciple,
  onBeverageChange,
  onPrincipleChange,
}: FilterBarProps) {
  return (
    <div className="space-y-4">
      {/* Beverage Chips */}
      <div className="flex flex-wrap gap-2">
        {BEVERAGE_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => onBeverageChange(filter.value)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-colors',
              selectedBeverage === filter.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Flavor Principle Dropdown */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Flavor Science:</span>
        <Select value={selectedPrinciple} onValueChange={onPrincipleChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select principle" />
          </SelectTrigger>
          <SelectContent>
            {FLAVOR_PRINCIPLES.map((principle) => (
              <SelectItem key={principle.value} value={principle.value}>
                {principle.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function BlockedPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Access Restricted</CardTitle>
          <CardDescription>
            We&apos;re sorry, but you must be 18 or older to use PairUp.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This restriction is in place to ensure the safety and appropriateness
            of our platform for all users.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}

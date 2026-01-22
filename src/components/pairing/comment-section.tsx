'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Comment {
  id: string
  user_id: string
  pairing_id: string
  content: string
  created_at: string
  profiles: {
    username: string | null
    avatar_url: string | null
  } | null
}

interface CommentSectionProps {
  pairingId: string
}

export function CommentSection({ pairingId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserProfile, setCurrentUserProfile] = useState<{ username: string | null; avatar_url: string | null } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPosting, setIsPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchCurrentUser()
    fetchComments()
  }, [pairingId])

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserId(user?.id || null)

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single()

      setCurrentUserProfile(profile)
    }
  }

  const fetchComments = async () => {
    setIsLoading(true)

    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles(username, avatar_url)')
      .eq('pairing_id', pairingId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching comments:', error)
      setError('Failed to load comments')
    } else {
      setComments((data as Comment[]) || [])
    }

    setIsLoading(false)
  }

  const handlePostComment = async () => {
    if (!currentUserId || !newComment.trim() || isPosting) return

    setIsPosting(true)
    setError(null)

    // Optimistic update - add comment immediately
    const optimisticComment: Comment = {
      id: `temp-${Date.now()}`,
      user_id: currentUserId,
      pairing_id: pairingId,
      content: newComment.trim(),
      created_at: new Date().toISOString(),
      profiles: currentUserProfile,
    }

    setComments(prev => [...prev, optimisticComment])
    setNewComment('')

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          user_id: currentUserId,
          pairing_id: pairingId,
          content: newComment.trim(),
        })
        .select('*, profiles(username, avatar_url)')
        .single()

      if (error) {
        console.error('Error posting comment:', error)
        setError('Failed to post comment')
        // Remove optimistic comment on error
        setComments(prev => prev.filter(c => c.id !== optimisticComment.id))
        setNewComment(newComment.trim())
      } else {
        // Replace optimistic comment with real one
        setComments(prev =>
          prev.map(c => c.id === optimisticComment.id ? (data as Comment) : c)
        )
      }
    } catch (err) {
      console.error('Error posting comment:', err)
      setError('Failed to post comment')
      setComments(prev => prev.filter(c => c.id !== optimisticComment.id))
      setNewComment(newComment.trim())
    } finally {
      setIsPosting(false)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comment Input */}
        {currentUserId ? (
          <div className="space-y-3">
            <div className="flex gap-3">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={currentUserProfile?.avatar_url || undefined} />
                <AvatarFallback>
                  {currentUserProfile?.username?.charAt(0).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px] resize-none"
                disabled={isPosting}
              />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handlePostComment}
                disabled={!newComment.trim() || isPosting}
                size="sm"
              >
                {isPosting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Posting...
                  </>
                ) : (
                  'Post Comment'
                )}
              </Button>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Sign in to leave a comment
          </p>
        )}

        {/* Divider */}
        {comments.length > 0 && <hr className="border-border" />}

        {/* Comments List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-muted flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-24" />
                  <div className="h-4 bg-muted rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No comments yet. Be the first to share your thoughts!
          </p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                  <AvatarFallback>
                    {comment.profiles?.username?.charAt(0).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      @{comment.profiles?.username || 'anonymous'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

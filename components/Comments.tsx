'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import UserProfileLink from './UserProfileLink'
import toast from 'react-hot-toast'

interface Comment {
  id: string
  encounter_id: string
  user_id?: string | null
  comment: string
  created_at: string
}

interface CommentsProps {
  encounterId: string
  isExpanded?: boolean
  onCommentAdded?: () => void
}

export default function Comments({ encounterId, isExpanded = false, onCommentAdded }: CommentsProps) {
  // Get authenticated user
  const { user } = useAuth()
  
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editCommentText, setEditCommentText] = useState('')
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Focus textarea when expanded and user is signed in
  useEffect(() => {
    if (isExpanded && commentTextareaRef.current && user) {
      setTimeout(() => {
        commentTextareaRef.current?.focus()
        commentTextareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }, [isExpanded, user])

  useEffect(() => {
    fetchComments()
  }, [encounterId])

  const fetchComments = async () => {
    try {
      setLoading(true)
      // Anyone can read comments (no auth required)
      const { data, error } = await supabase
        .from('Comments')
        .select('*')
        .eq('encounter_id', encounterId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setComments(data || [])
    } catch (err) {
      console.error('Error fetching comments:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!newComment.trim()) {
      return
    }
    
    // Require authentication to comment
    if (!user) {
      alert('Please sign in to comment. You will be redirected to the sign-in page.')
      return
    }

    try {
      setSubmitting(true)
      
      // First, get the encounter to find the owner
      const { data: encounter, error: encounterError } = await supabase
        .from('Encounters')
        .select('user_id')
        .eq('id', encounterId)
        .single()

      if (encounterError) throw encounterError

      // Insert the comment
      const { data: commentData, error } = await supabase
        .from('Comments')
        .insert([
          {
            encounter_id: encounterId,
            comment: newComment.trim(),
            user_id: user.id, // Use authenticated user ID
          },
        ])
        .select()
        .single()

      if (error) {
        // Log all possible error properties
        const errorDetails = {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          status: (error as any).status,
          statusText: (error as any).statusText,
          error: (error as any).error,
          fullError: error,
          errorString: String(error),
          errorJSON: JSON.stringify(error, Object.getOwnPropertyNames(error))
        }
        
        // Log error details for debugging
        console.error('Supabase error inserting comment:', errorDetails)
        
        // Try to extract error message from various possible locations
        let errorMsg = 'Failed to post comment'
        if (error.message) {
          errorMsg = error.message
        } else if ((error as any).error?.message) {
          errorMsg = (error as any).error.message
        } else if (error.code) {
          errorMsg = `Database error (${error.code})`
          if (error.details) errorMsg += `: ${error.details}`
          if (error.hint) errorMsg += ` (${error.hint})`
        } else if ((error as any).status) {
          errorMsg = `HTTP error ${(error as any).status}: ${(error as any).statusText || 'Unknown error'}`
        } else {
          // Try to stringify the error
          try {
            errorMsg = JSON.stringify(error, Object.getOwnPropertyNames(error))
          } catch {
            errorMsg = String(error) || 'Unknown database error'
          }
        }
        
        throw new Error(errorMsg)
      }

      // Note: Notification is automatically created by the database trigger (trigger_notify_on_comment)
      // No need to manually create notification here to avoid duplicates
      
      toast.success('Comment posted!')
      setNewComment('')
      await fetchComments()
      onCommentAdded?.()
    } catch (err) {
      console.error('Error adding comment:', err)
      let errorMessage = 'Unknown error'
      
      if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === 'object' && err !== null) {
        // Handle Supabase errors
        const supabaseError = err as any
        if (supabaseError.message) {
          errorMessage = supabaseError.message
        } else if (supabaseError.code) {
          errorMessage = `Error ${supabaseError.code}: ${supabaseError.details || supabaseError.hint || 'Database error'}`
        } else {
          errorMessage = JSON.stringify(err)
        }
      } else {
        errorMessage = String(err)
      }
      
      console.error('Error details:', errorMessage, 'Full error:', err)
      toast.error(`Failed to post comment: ${errorMessage}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (comment: Comment) => {
    if (!user || !user.id) return
    
    // More robust comparison - normalize both IDs
    const commentUserId = comment.user_id ? String(comment.user_id).trim() : null
    const currentUserId = user.id ? String(user.id).trim() : null
    
    if (commentUserId && currentUserId && commentUserId === currentUserId) {
      setEditingCommentId(comment.id)
      setEditCommentText(comment.comment)
    }
  }
  
  // Helper function to check if user owns comment
  const isOwnComment = (comment: Comment): boolean => {
    if (!user || !user.id || !comment.user_id) {
      return false
    }
    const commentUserId = String(comment.user_id).trim()
    const currentUserId = String(user.id).trim()
    return commentUserId === currentUserId
  }

  const handleCancelEdit = () => {
    setEditingCommentId(null)
    setEditCommentText('')
  }

  const handleSaveEdit = async (commentId: string) => {
    if (!user || !editCommentText.trim()) return
    
    try {
      const { error } = await supabase
        .from('Comments')
        .update({ comment: editCommentText.trim() })
        .eq('id', commentId)
        .eq('user_id', user.id) // Only allow editing own comments

      if (error) {
        console.error('Error updating comment:', error)
        throw error
      }
      
      setEditingCommentId(null)
      setEditCommentText('')
      fetchComments()
    } catch (err) {
      console.error('Error updating comment:', err)
      alert('Failed to update comment. You can only edit your own comments.')
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!user) return
    
    if (!confirm('Are you sure you want to delete this comment?')) {
      return
    }
    
    try {
      const { error } = await supabase
        .from('Comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id) // Only allow deleting own comments

      if (error) {
        console.error('Error deleting comment:', error)
        throw error
      }
      fetchComments()
    } catch (err) {
      console.error('Error deleting comment:', err)
      alert('Failed to delete comment. You can only delete your own comments.')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (!isExpanded) {
    return null
  }

  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold mb-3">Comments</h4>
      
      {/* Comment Form - Only show if authenticated */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-4" noValidate>
          <textarea
            ref={commentTextareaRef}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows={2}
            id="comment-textarea"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
              focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-md
              hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
          {!newComment.trim() && (
            <p className="mt-1 text-xs text-gray-500">Type a comment to enable the button</p>
          )}
        </form>
      ) : (
        <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-md text-center">
          <p className="text-sm text-yellow-800 mb-3 font-semibold">
            🐾 Sign in to comment on the paw!
          </p>
          <Link
            href="/signin"
            className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors font-semibold"
          >
            Sign In →
          </Link>
        </div>
      )}

      {/* Comments List - Anyone can view */}
      {loading ? (
        <p className="text-sm text-gray-600">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-600">No comments yet. {user ? 'Be the first to comment!' : 'Sign in to be the first to comment!'}</p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="p-3 bg-gray-50 rounded-md relative">
              {editingCommentId === comment.id ? (
                // Edit mode
                <div className="space-y-2">
                  <textarea
                    value={editCommentText}
                    onChange={(e) => setEditCommentText(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
                      focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSaveEdit(comment.id)}
                      disabled={!editCommentText.trim()}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md
                        hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded-md
                        hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View mode
                <>
                  <p className="text-sm text-gray-800 mb-1">{comment.comment}</p>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserProfileLink userId={comment.user_id} showAvatar={true} className="text-xs font-semibold" />
                        <span className="text-xs text-gray-400">•</span>
                        <p className="text-xs text-gray-600">{formatDate(comment.created_at)}</p>
                      </div>
                      {/* Show edit/delete buttons only for own comments */}
                      {isOwnComment(comment) && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(comment)}
                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                          >
                            Edit
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => handleDelete(comment.id)}
                            className="text-xs text-red-600 hover:text-red-800 underline"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


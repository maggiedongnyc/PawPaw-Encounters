'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

interface Comment {
  id: string
  encounter_id: string
  user_id?: string | null
  comment: string
  created_at: string
}

interface CommentsProps {
  encounterId: string
}

export default function Comments({ encounterId }: CommentsProps) {
  // Get authenticated user
  const { user } = useAuth()
  
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editCommentText, setEditCommentText] = useState('')

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
      console.log('Fetched comments:', data?.map(c => ({ 
        id: c.id, 
        user_id: c.user_id, 
        user_id_type: typeof c.user_id,
        user_id_string: String(c.user_id),
        comment: c.comment.substring(0, 20) 
      })))
      console.log('Current user:', user ? { id: user.id, id_type: typeof user.id, id_string: String(user.id) } : 'null')
      setComments(data || [])
    } catch (err) {
      console.error('Error fetching comments:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return
    
    // Require authentication to comment
    if (!user) {
      alert('Please sign in to comment. You will be redirected to the sign-in page.')
      // Could redirect to sign-in, but for now just show alert
      return
    }

    try {
      setSubmitting(true)
      const { error } = await supabase
        .from('Comments')
        .insert([
          {
            encounter_id: encounterId,
            comment: newComment.trim(),
            user_id: user.id, // Use authenticated user ID
          },
        ])

      if (error) throw error

      console.log('Comment created successfully with user_id:', user.id)
      setNewComment('')
      fetchComments()
    } catch (err) {
      console.error('Error adding comment:', err)
      alert('Failed to post comment. Please try again.')
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
    } else {
      console.log('Cannot edit: user mismatch', { 
        commentUserId: comment.user_id, 
        commentUserIdString: commentUserId,
        currentUserId: user.id,
        currentUserIdString: currentUserId,
        match: commentUserId === currentUserId
      })
    }
  }
  
  // Helper function to check if user owns comment
  const isOwnComment = (comment: Comment): boolean => {
    if (!user || !user.id || !comment.user_id) {
      console.log('isOwnComment: missing data', { hasUser: !!user, hasUserId: !!user?.id, hasCommentUserId: !!comment.user_id })
      return false
    }
    const commentUserId = String(comment.user_id).trim()
    const currentUserId = String(user.id).trim()
    const matches = commentUserId === currentUserId
    console.log('isOwnComment check:', { 
      commentUserId, 
      currentUserId, 
      matches,
      commentUserIdLength: commentUserId.length,
      currentUserIdLength: currentUserId.length
    })
    return matches
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

  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold mb-3">Comments</h4>
      
      {/* Comment Form - Only show if authenticated */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
              focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-md
              hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      ) : (
        <div className="mb-4 p-3 bg-yellow-50 border-2 border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800 mb-2">
            💬 Sign in to add a comment
          </p>
          <Link
            href="/signin"
            className="text-sm text-blue-600 hover:text-blue-800 underline font-medium"
          >
            Go to sign in →
          </Link>
        </div>
      )}

      {/* Comments List - Anyone can view */}
      {loading ? (
        <p className="text-sm text-gray-500">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-500">No comments yet. {user ? 'Be the first to comment!' : 'Sign in to be the first to comment!'}</p>
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
                      <p className="text-xs text-gray-500">{formatDate(comment.created_at)}</p>
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


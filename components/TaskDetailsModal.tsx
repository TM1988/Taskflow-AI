import { useState } from 'react'
import { format } from 'date-fns'
import { Task } from '@/app/providers'
import { RiCloseLine, RiChat1Line, RiSendPlane2Line } from 'react-icons/ri'
import { v4 as uuidv4 } from 'uuid'

interface Comment {
  id: string
  text: string
  author: string
  createdAt: string
}

interface Props {
  task: Task
  onClose: () => void
  onUpdate: (task: Task) => void
}

export default function TaskDetailsModal({ task, onClose, onUpdate }: Props) {
  const [title, setTitle] = useState(task.title)
  const [dueDate, setDueDate] = useState(task.dueDate || '')
  const [description, setDescription] = useState(task.description || '')
  const [newComment, setNewComment] = useState('')
  const [comments, setComments] = useState<Comment[]>(task.comments || [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Create a simple update object with just the fields we want to change
    const updates = {
      title,
      description,
      dueDate: dueDate || undefined,
      comments
    };
    
    console.log('Updating task from modal:', {
      id: task.id,
      updates
    });
    
    // Call the update function with the simplified updates
    onUpdate({
      ...task,
      ...updates
    });
    
    // Close the modal
    onClose();
  }
  
  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    const comment: Comment = {
      id: uuidv4(),
      text: newComment,
      author: 'Tanish',
      createdAt: new Date().toISOString()
    };
    
    setComments([...comments, comment]);
    setNewComment('');
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Task Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <RiCloseLine className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  task.completed
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                }`}>
                  {task.completed ? 'Completed' : task.status}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field w-full border border-gray-300 dark:border-gray-600 focus:border-primary dark:focus:border-primary"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input-field w-full border border-gray-300 dark:border-gray-600 focus:border-primary dark:focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Created</label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {format(new Date(task.createdAt), 'PPP p')}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <RiChat1Line className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Comments</h3>
              </div>

              <div className="space-y-4 mb-4">
                {comments.map(comment => (
                  <div key={comment.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {comment.author[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{comment.author}</p>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {format(new Date(comment.createdAt), 'PP')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{comment.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="input-field flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <button 
                  type="button" 
                  className="button-primary px-4"
                  onClick={handleAddComment}
                >
                  <RiSendPlane2Line className="w-5 h-5" />
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button onClick={onClose} className="button-secondary">
            Cancel
          </button>
          <button onClick={handleSubmit} className="button-primary">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
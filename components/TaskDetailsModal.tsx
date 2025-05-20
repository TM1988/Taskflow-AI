import { useState, useContext } from 'react'
import { format } from 'date-fns'
import { TodoContext, Task } from '@/app/providers'
import { RiCloseLine, RiCheckLine, RiEditLine, RiDeleteBinLine, RiCalendarLine, RiInformationLine } from 'react-icons/ri'

interface TaskDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  task: Task
}

export default function TaskDetailsModal({ isOpen, onClose, task }: TaskDetailsModalProps) {
  const { toggleTask, deleteTask, updateTask } = useContext(TodoContext) || {}
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(task.title)
  const [editedDescription, setEditedDescription] = useState(task.description || '')
  const [editedPriority, setEditedPriority] = useState(task.priority)
  const [editedDueDate, setEditedDueDate] = useState(task.dueDate || '')
  
  if (!isOpen) return null
  
  const handleSave = () => {
    if (updateTask) {
      updateTask(task.id, {
        title: editedTitle,
        description: editedDescription || undefined,
        priority: editedPriority,
        dueDate: editedDueDate || undefined
      })
    }
    setIsEditing(false)
  }
  
  const handleDelete = () => {
    if (deleteTask) {
      deleteTask(task.id)
      onClose()
    }
  }
  
  const handleToggleComplete = () => {
    if (toggleTask) {
      toggleTask(task.id)
    }
  }
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No due date'
    try {
      return format(new Date(dateString), 'PPP')
    } catch (error) {
      console.error('Invalid date format:', error)
      return 'Invalid date'
    }
  }
  
  const priorityColors = {
    high: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30',
    medium: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30',
    low: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30'
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-fadeIn">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'Edit Task' : 'Task Details'}
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <RiCloseLine className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6">
          {isEditing ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="input-field"
                  placeholder="Task title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="input-field h-24 resize-none"
                  placeholder="Task description (optional)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                <select
                  value={editedPriority}
                  onChange={(e) => setEditedPriority(e.target.value as 'low' | 'medium' | 'high')}
                  className="input-field"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                <input
                  type="date"
                  value={editedDueDate}
                  onChange={(e) => setEditedDueDate(e.target.value)}
                  className="input-field"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button 
                  onClick={() => setIsEditing(false)} 
                  className="button-secondary"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave} 
                  className="button-primary"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <button
                  onClick={handleToggleComplete}
                  className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors duration-200 mt-1 ${task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600 hover:border-green-500'}`}
                >
                  {task.completed && <RiCheckLine className="w-4 h-4 text-white" />}
                </button>
                
                <div className="flex-1">
                  <h3 className={`text-xl font-medium ${task.completed ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>
                    {task.title}
                  </h3>
                  
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}>
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                      </span>
                      
                      {task.dueDate && (
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <RiCalendarLine className="w-4 h-4 mr-1" />
                          {formatDate(task.dueDate)}
                        </div>
                      )}
                    </div>
                    
                    {task.description && (
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <RiInformationLine className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {task.description}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Created: {formatDate(task.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button 
                  onClick={handleDelete} 
                  className="button-secondary flex items-center gap-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <RiDeleteBinLine className="w-5 h-5" />
                  Delete
                </button>
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="button-primary flex items-center gap-1"
                >
                  <RiEditLine className="w-5 h-5" />
                  Edit
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
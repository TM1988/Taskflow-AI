import { useState } from 'react'
import TaskForm from './TaskForm'
import { RiCloseLine } from 'react-icons/ri'

interface Props {
  isOpen: boolean
  onClose: () => void
  onComplete?: () => void
}

export default function TaskFormModal({ isOpen, onClose, onComplete }: Props) {
  if (!isOpen) return null

  const handleComplete = () => {
    if (onComplete) {
      onComplete()
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-fadeIn">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create New Task</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <RiCloseLine className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <TaskForm onComplete={handleComplete} />
        </div>
      </div>
    </div>
  )
}
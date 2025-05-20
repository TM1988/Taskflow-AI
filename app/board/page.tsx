'use client'

import { useContext, useState, useRef, useCallback } from 'react'
import { TodoContext } from '@/app/providers'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import Header from '@/components/Header'
import TaskDetailsModal from '@/components/TaskDetailsModal'
import { RiDragMoveLine, RiAddLine } from 'react-icons/ri'
import TaskFormModal from '@/components/TaskFormModal'
import { Task } from '@/app/providers'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'

// Define item types for drag and drop
const ItemTypes = {
  TASK: 'task'
}

// Define priority colors
const priorityColors = {
  high: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
  low: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
}

// Task Card Component with Drag functionality
const TaskCard = ({ task, index, columnId, onTaskClick }: { task: Task, index: number, columnId: string, onTaskClick: (task: Task) => void }) => {
  const ref = useRef<HTMLDivElement>(null)
  
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.TASK,
    item: () => {
      console.log('Starting drag for task:', task.id, 'from column:', columnId);
      return { id: task.id, columnId, index };
    },
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult<{ moved: boolean }>();
      if (item && dropResult) {
        console.log('Drag ended with result:', dropResult);
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  })

  // Apply the drag ref to our div
  drag(ref)

  return (
    <div 
      ref={ref}
      className={`kanban-card group cursor-grab ${isDragging ? 'opacity-50' : ''}`}
      onClick={() => onTaskClick(task)}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
          <RiDragMoveLine className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-900 dark:text-white font-medium">
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs ${priorityColors[task.priority]}`}>
              {task.priority}
            </span>
            {task.dueDate && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                Due: {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Column Component with Drop functionality
const Column = ({ columnId, title, tasks, onTaskClick, onDrop }: { 
  columnId: string, 
  title: string, 
  tasks: Task[], 
  onTaskClick: (task: Task) => void,
  onDrop: (taskId: string, sourceColumn: string, targetColumn: string) => void
}) => {
  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.TASK,
    drop: (item: { id: string, columnId: string }, monitor) => {
      console.log('Dropping item:', item.id, 'from', item.columnId, 'to', columnId);
      
      // Only process if we're moving to a different column
      if (item.columnId !== columnId) {
        // Call the onDrop handler to update the task status
        onDrop(item.id, item.columnId, columnId);
        // Return a value to signal the drop was handled
        return { moved: true };
      }
      return undefined;
    },
    hover: (item, monitor) => {
      // You can add hover effects here if needed
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  })

  // Create a div ref to combine with the drop ref
  const dropRef = useRef<HTMLDivElement>(null)
  
  // Apply the drop ref to our div ref
  drop(dropRef)

  return (
    <div className="kanban-column">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">{title}</h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">{tasks.length}</span>
      </div>
      <div 
        ref={dropRef} 
        className={`h-full min-h-[400px] ${isOver ? 'bg-gray-100 dark:bg-gray-700/50' : ''}`}
      >
        {tasks.map((task, index) => (
          <TaskCard 
            key={task.id} 
            task={task} 
            index={index} 
            columnId={columnId} 
            onTaskClick={onTaskClick} 
          />
        ))}
      </div>
    </div>
  )
}

function Board() {
  const { tasks = [], toggleTask, updateTask } = useContext(TodoContext) || {}
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showNewTaskForm, setShowNewTaskForm] = useState(false)
  // Add local state to force re-render when tasks are moved
  const [, forceUpdate] = useState({})

  // Group tasks by completion status
  // Since we don't have a status property, we'll use the completed property
  // and priority to determine which column a task belongs to
  const columns = {
    todo: {
      title: 'To Do',
      items: tasks.filter(task => !task.completed && task.priority === 'low')
    },
    inProgress: {
      title: 'In Progress',
      items: tasks.filter(task => !task.completed && task.priority === 'medium')
    },
    review: {
      title: 'Review',
      items: tasks.filter(task => !task.completed && task.priority === 'high')
    },
    done: {
      title: 'Done',
      items: tasks.filter(task => task.completed)
    }
  }

  // Memoize the handleDrop function to avoid recreating it on every render
  const handleDrop = useCallback((taskId: string, sourceColumn: string, targetColumn: string) => {
    console.log('handleDrop called with:', taskId, sourceColumn, targetColumn);
    
    // Find the task in the tasks array
    const taskToMove = tasks.find(task => task.id === taskId);
    
    if (!taskToMove) {
      console.error('Task not found:', taskId);
      return false;
    }
    
    try {
      // Determine if the task should be marked as completed
      const shouldComplete = targetColumn === 'done';
      
      // Determine the new priority based on the target column
      let newPriority = taskToMove.priority;
      if (targetColumn === 'todo') newPriority = 'low';
      if (targetColumn === 'inProgress') newPriority = 'medium';
      if (targetColumn === 'review') newPriority = 'high';
      
      console.log('Moving task from', sourceColumn, 'to', targetColumn, 'with completion:', shouldComplete);
      
      // Create an updated task with the new priority and completion status
      const updatedTask = {
        ...taskToMove,
        priority: newPriority as 'low' | 'medium' | 'high',
        completed: shouldComplete
      };
      
      // Use the updateTask function to update the task directly
      if (updateTask) {
        updateTask(taskId, updatedTask);
        console.log('Task updated successfully with new priority:', newPriority, 'and completion:', shouldComplete);
        
        // Force a re-render to update the UI immediately
        setTimeout(() => forceUpdate({}), 10);
        return true;
      } else {
        console.error('updateTask function not available');
        return false;
      }
    } catch (error) {
      console.error('Error updating task:', error);
      return false;
    }
  }, [tasks, updateTask, forceUpdate]);

  // Get the current user from auth context
  const { user } = useAuth();
  const userName = user?.displayName || 'Tanish';
  
  return (
    <div className="min-h-screen">
      <Header title="Board" subtitle="Organize and manage your tasks" />
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="section-title">Board</h1>
              <p className="section-subtitle">Manage your tasks with a drag-and-drop Kanban board</p>
            </div>
            <button 
              onClick={() => setShowNewTaskForm(true)}
              className="button-primary flex items-center gap-2"
            >
              <RiAddLine className="w-5 h-5" />
              New Task
            </button>
          </div>

          <TaskFormModal 
            isOpen={showNewTaskForm} 
            onClose={() => setShowNewTaskForm(false)} 
            onComplete={() => setShowNewTaskForm(false)} 
          />
          
          <DndProvider backend={HTML5Backend}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(columns).map(([columnId, column]) => (
                <Column
                  key={columnId}
                  columnId={columnId}
                  title={column.title}
                  tasks={column.items}
                  onTaskClick={setSelectedTask}
                  onDrop={handleDrop}
                />
              ))}
            </div>
          </DndProvider>

          {selectedTask && (
            <TaskDetailsModal
              task={selectedTask}
              onClose={() => setSelectedTask(null)}
              isOpen={!!selectedTask}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default function BoardPage() {
  return (
    <ProtectedRoute>
      <Board />
    </ProtectedRoute>
  )
}
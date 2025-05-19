'use client'

import { useContext, useState } from 'react'
import { TodoContext } from '@/app/providers'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import Header from '@/components/Header'
import TaskDetailsModal from '@/components/TaskDetailsModal'
import { RiDragMoveLine, RiAddLine } from 'react-icons/ri'
import TaskForm from '@/components/TaskForm'

export default function Board() {
  const { tasks = [], toggleTask, updateTaskStatus } = useContext(TodoContext) || {}
  const [selectedTask, setSelectedTask] = useState(null)
  const [showNewTaskForm, setShowNewTaskForm] = useState(false)

  const columns = {
    todo: {
      title: 'To Do',
      items: tasks.filter(task => task.status === 'todo')
    },
    inProgress: {
      title: 'In Progress',
      items: tasks.filter(task => task.status === 'inProgress')
    },
    review: {
      title: 'Review',
      items: tasks.filter(task => task.status === 'review')
    },
    done: {
      title: 'Done',
      items: tasks.filter(task => task.completed)
    }
  }

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const { source, destination } = result;
    
    if (source.droppableId !== destination.droppableId) {
      const taskId = result.draggableId;
      if (destination.droppableId === 'done') {
        toggleTask(taskId);
      } else {
        updateTaskStatus(taskId, destination.droppableId);
      }
    }
  }

  const priorityColors = {
    high: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    low: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
  }

  return (
    <div className="min-h-screen">
      <Header />
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

          {showNewTaskForm && (
            <div className="mb-8">
              <TaskForm onComplete={() => setShowNewTaskForm(false)} />
            </div>
          )}
          
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(columns).map(([columnId, column]) => (
                <div key={columnId} className="kanban-column">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">{column.title}</h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{column.items.length}</span>
                  </div>
                  
                  <Droppable droppableId={columnId}>
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="h-full min-h-[400px]"
                      >
                        {column.items.map((task, index) => (
                          <Draggable
                            key={task.id}
                            draggableId={task.id}
                            index={index}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="kanban-card group cursor-pointer"
                                onClick={() => setSelectedTask(task)}
                              >
                                <div className="flex items-start gap-3">
                                  <div
                                    {...provided.dragHandleProps}
                                    className="mt-1 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <RiDragMoveLine className="w-4 h-4" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm text-gray-900 dark:text-white font-medium">
                                      {task.title}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                      <span className={`px-2 py-0.5 rounded-full text-xs ${priorityColors[task.priority]}`}>
                                        {task.priority}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </DragDropContext>

          {selectedTask && (
            <TaskDetailsModal
              task={selectedTask}
              onClose={() => setSelectedTask(null)}
              onUpdate={(updatedTask) => {
                // Handle task update
                setSelectedTask(null)
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
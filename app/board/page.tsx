'use client'

import { useContext } from 'react'
import { TodoContext } from '@/app/providers'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

export default function Board() {
  const { tasks = [], toggleTask, updateTaskStatus } = useContext(TodoContext) || {}

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

  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-xl mb-6">Board</h2>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-6">
          {Object.entries(columns).map(([columnId, column]) => (
            <div key={columnId} className="kanban-column">
              <h3 className="text-lg mb-4">{column.title}</h3>
              
              <Droppable droppableId={columnId}>
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="min-h-[500px]"
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
                            {...provided.dragHandleProps}
                            className="kanban-card"
                          >
                            <div className="text-sm">{task.title}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Priority: {task.priority}
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
    </div>
  )
}
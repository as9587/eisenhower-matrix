"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, X, Calendar } from "lucide-react"
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

type TaskCard = {
  id: string
  title: string
  dueDate: string
  quadrant: "urgent-important" | "not-urgent-important" | "urgent-not-important" | "not-urgent-not-important"
}

type Quadrant = {
  id: string
  title: string
  description: string
  color: string
}

const quadrants: Quadrant[] = [
  {
    id: "urgent-important",
    title: "Do First",
    description: "Urgent & Important",
    color: "bg-red-50 border-red-200",
  },
  {
    id: "not-urgent-important",
    title: "Schedule",
    description: "Important, Not Urgent",
    color: "bg-yellow-50 border-yellow-200",
  },
  {
    id: "urgent-not-important",
    title: "Delegate",
    description: "Urgent, Not Important",
    color: "bg-blue-50 border-blue-200",
  },
  {
    id: "not-urgent-not-important",
    title: "Eliminate",
    description: "Not Urgent, Not Important",
    color: "bg-gray-50 border-gray-200",
  },
]

function TaskCardComponent({
  task,
  isDragging,
  setTasks,
  editingTask,
  setEditingTask,
}: {
  task: TaskCard
  isDragging?: boolean
  setTasks: any
  editingTask: string | null
  setEditingTask: (id: string | null) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id })
  const [editForm, setEditForm] = useState({ title: "", dueDate: "" })

  const isEditing = editingTask === task.id

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleStartEdit = (task: TaskCard) => {
    setEditingTask(task.id)
    setEditForm({ title: task.title, dueDate: task.dueDate })
  }

  const handleSaveEdit = () => {
    if (editingTask && editForm.title && editForm.dueDate) {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === editingTask ? { ...task, title: editForm.title, dueDate: editForm.dueDate } : task,
        ),
      )
      setEditingTask(null)
      setEditForm({ title: "", dueDate: "" })
    }
  }

  const handleCancelEdit = () => {
    setEditingTask(null)
    setEditForm({ title: "", dueDate: "" })
  }

  if (isEditing) {
    return (
      <div ref={setNodeRef} style={style} className="mb-2">
        <Card className="border-blue-300 shadow-md">
          <CardContent className="p-3">
            <div className="space-y-2">
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Task title..."
                className="text-sm"
              />
              <Input
                type="date"
                value={editForm.dueDate}
                onChange={(e) => setEditForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                className="text-sm"
              />
              <div className="flex gap-1 justify-end">
                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveEdit}>
                  Save
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group cursor-move ${isDragging ? "opacity-50" : ""}`}
    >
      <Card className="mb-2 hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex justify-between items-start mb-2">
            <h4
              className="font-medium text-sm leading-tight cursor-pointer hover:text-blue-600 flex-1"
              onClick={() => handleStartEdit(task)}
            >
              {task.title}
            </h4>
          </div>
          <div
            className="flex items-center text-xs text-muted-foreground cursor-pointer hover:text-blue-600"
            onClick={() => handleStartEdit(task)}
          >
            <Calendar className="w-3 h-3 mr-1" />
            {task.dueDate}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function QuadrantSection({
  quadrant,
  tasks,
  onDeleteTask,
  setTasks,
  editingTask,
  setEditingTask,
}: {
  quadrant: Quadrant
  tasks: TaskCard[]
  onDeleteTask: (taskId: string) => void
  setTasks: any
  editingTask: string | null
  setEditingTask: (id: string | null) => void
}) {
  const { setNodeRef, isOver } = useSortable({
    id: quadrant.id,
    data: {
      type: "quadrant",
    },
  })

  return (
    <Card ref={setNodeRef} className={`h-80 ${quadrant.color} ${isOver ? "ring-2 ring-blue-400" : ""}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{quadrant.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{quadrant.description}</p>
      </CardHeader>
      <CardContent className="pt-0 h-56 overflow-y-auto">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <div key={task.id} className="relative group">
              <TaskCardComponent
                task={task}
                setTasks={setTasks}
                editingTask={editingTask}
                setEditingTask={setEditingTask}
              />
              {task.id !== editingTask && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                  onClick={() => onDeleteTask(task.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </SortableContext>
      </CardContent>
    </Card>
  )
}

export default function Component() {
  const [tasks, setTasks] = useState<TaskCard[]>([
    {
      id: "1",
      title: "Fix critical bug in production",
      dueDate: "2024-01-15",
      quadrant: "urgent-important",
    },
    {
      id: "2",
      title: "Plan quarterly review",
      dueDate: "2024-01-30",
      quadrant: "not-urgent-important",
    },
    {
      id: "3",
      title: "Respond to non-critical emails",
      dueDate: "2024-01-16",
      quadrant: "urgent-not-important",
    },
  ])

  const [activeTask, setActiveTask] = useState<TaskCard | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newTask, setNewTask] = useState({ title: "", dueDate: "" })

  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ title: "", dueDate: "" })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id)
    if (task) {
      setActiveTask(task)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const taskId = active.id as string
    const newQuadrant = over.id as TaskCard["quadrant"]

    if (quadrants.some((q) => q.id === newQuadrant)) {
      setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, quadrant: newQuadrant } : task)))
    }
  }

  const handleCreateTask = () => {
    if (newTask.title && newTask.dueDate) {
      const task: TaskCard = {
        id: Date.now().toString(),
        title: newTask.title,
        dueDate: newTask.dueDate,
        quadrant: "not-urgent-not-important",
      }
      setTasks((prev) => [...prev, task])
      setNewTask({ title: "", dueDate: "" })
      setIsDialogOpen(false)
    }
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId))
  }

  const getTasksForQuadrant = (quadrantId: string) => {
    return tasks.filter((task) => task.quadrant === quadrantId)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Eisenhower Matrix</h1>
          <p className="text-muted-foreground">Organize tasks by importance and urgency</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  value={newTask.title}
                  onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter task title..."
                />
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask((prev) => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
              <Button onClick={handleCreateTask} className="w-full">
                Create Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quadrants.map((quadrant) => (
            <QuadrantSection
              key={quadrant.id}
              quadrant={quadrant}
              tasks={getTasksForQuadrant(quadrant.id)}
              onDeleteTask={handleDeleteTask}
              setTasks={setTasks}
              editingTask={editingTask}
              setEditingTask={setEditingTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <TaskCardComponent
              task={activeTask}
              isDragging
              setTasks={setTasks}
              editingTask={editingTask}
              setEditingTask={setEditingTask}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>
          Drag tasks between quadrants to organize by priority. Click on task title or date to edit. Hover over tasks to
          delete them.
        </p>
      </div>
    </div>
  )
}

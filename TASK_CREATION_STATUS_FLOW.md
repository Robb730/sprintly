# Task Creation and Status Flow

This document describes how task creation and status management work in the Agile Sprint Tracker app.
It explains the main React components and hooks involved, how task status is determined, and how updates are persisted.

---

## 1. Overview

Tasks are created and managed inside the `ProjectDetailsPage.jsx` workflow. The page loads project data, project members, sprints, milestones, and tasks.

The task flow has three major parts:

1. Task creation via `CreateTaskModal.jsx`
2. Task storage and updates via `useTasks.js`
3. Task status and board rendering via `KanbanBoard.jsx`, `ListView.jsx`, and `TaskDetailModal.jsx`

---

## 2. Task creation flow

### 2.1. Opening the modal

- The button on `ProjectDetailsPage.jsx` calls `setCreateStatus('todo')` or `setCreateStatus(...)`.
- When `createStatus !== null`, the component renders `CreateTaskModal`.
- `CreateTaskModal` receives props including `members`, `sprints`, `milestones`, `onClose`, and `onCreate`.

### 2.2. Modal form fields

The modal allows the user to enter:

- `title` (required)
- `description` (optional)
- `priority` (`high`, `medium`, `low`)
- `assigned_to` (project member)
- `due_date`
- `sprint_id` (optional sprint assignment)
- `milestone_id` (optional milestone assignment)

### 2.3. Automatic status assignment

The modal automatically chooses the initial task status:

- `todo` when both `assigned_to` and `due_date` are set
- `backlog` when either `assigned_to` or `due_date` is missing

This rule is implemented in `src/components/tasks/CreateTaskModal.jsx`:

```js
const resolvedStatus = (form.assigned_to && form.due_date) ? 'todo' : 'backlog'
```

### 2.4. Sending task creation to Supabase

When the form is submitted, `CreateTaskModal` calls the `onCreate` callback with:

- `title`
- `description`
- `status`
- `priority`
- `assigned_to`
- `due_date`
- `sprint_id`
- `milestone_id`

In `src/pages/ProjectDetailsPage.jsx`, `handleCreateTask` adds `project_id` and forwards the request to `createTask` from `useTasks`.

---

## 3. Task persistence and state management

### 3.1. `useTasks` hook

File: `src/hooks/useTasks.js`

This hook manages:

- `tasks` state
- loading state
- error state
- fetching tasks from Supabase
- realtime subscription for task changes
- creating, updating, deleting tasks

### 3.2. Fetching tasks

`fetchTasks` retrieves tasks for the current project with:

```js
supabase
  .from('tasks')
  .select(TASK_SELECT)
  .eq('project_id', projectId)
  .order('created_at', { ascending: false })
```

It loads task records that belong to the current `projectId`.

### 3.3. Creating a task

`createTask` inserts the record into Supabase:

```js
supabase
  .from('tasks')
  .insert(taskData)
  .select(TASK_SELECT)
  .single()
```

On success, it appends the new task to local `tasks` state.

### 3.4. Updating tasks

`updateTask` updates any field on a task record and replaces the task in local state with the returned data.

### 3.5. Deleting tasks

`deleteTask` removes a task from Supabase and filters it out of local `tasks` state.

---

## 4. Status lifecycle and values

The application uses the following status values, defined in `src/components/data/projectData.jsx`:

- `backlog` — not ready to work on yet
- `todo` — ready to start work
- `in_progress` — work is in progress
- `in_review` — task is awaiting review
- `done` — task is completed

### 4.1. What `backlog` means

A task enters `backlog` when it lacks either:

- an assignee
- a due date

This keeps unfocused or unprepared work separate from active tasks.

### 4.2. What `todo` means

A task becomes `todo` when it has both:

- an assignee
- a due date

That means the task is ready to be pulled into work.

---

## 5. Task status updates in the UI

### 5.1. Kanban drag and drop

`KanbanBoard.jsx` allows tasks to move between status columns.
When a task is dropped into a new column, it calls `onStatusChange(task.id, colId)`.

In `ProjectDetailsPage.jsx`, `onStatusChange` is set to `updateTaskStatusOptimistic` from `useTasks`.

### 5.2. Optimistic updates

`updateTaskStatusOptimistic` immediately changes the task locally and then updates Supabase.
If the update fails, it refetches tasks to restore the true server state.

### 5.3. Editing from task details

`TaskDetailModal.jsx` allows manual status changes and full task edits.
The modal sends updated task fields to `handleTaskUpdate` in `ProjectDetailsPage.jsx`, which calls `updateTask`.

---

## 6. How progress is computed

Project progress is derived from tasks in `ProjectDetailsPage.jsx`:

```js
const liveProgress = tasks.length
  ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100)
  : project.progress ?? 0
```

That means the app measures progress as the percentage of tasks marked `done`.

---

## 7. Permissions and task creation

Task creation is restricted by permissions:

- Managers always can add tasks
- Contributors can add tasks only when `can_add_tasks` is true

This is computed in `ProjectDetailsPage.jsx` using project role and member permissions.

---

## 8. Key files to reference

- `src/components/tasks/CreateTaskModal.jsx`
- `src/hooks/useTasks.js`
- `src/pages/ProjectDetailsPage.jsx`
- `src/components/tasks/KanbanBoard.jsx`
- `src/components/tasks/TaskDetailModal.jsx`
- `src/components/data/projectData.jsx`

---

## 9. Summary

The task system is built around a simple but clear lifecycle:

- Tasks start in `backlog` when not fully defined
- Tasks move to `todo` once they are assigned and dated
- Users then move tasks through `in_progress`, `in_review`, and `done`
- The app persists all changes through Supabase and keeps local state sync'd with realtime updates

This structure helps keep work organized, visible, and aligned with Agile-style backlog and Kanban workflows.

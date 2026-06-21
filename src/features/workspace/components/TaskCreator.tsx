import { useCallback, useState } from 'react';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';
import { projectsApi, type TaskNode } from '../../../api/projects';
import { mapServerErrorToEnglish } from '../../../api/errors';
import type { TaskCreatorMode, TaskDraftPosition } from '../utils/workspaceUtils';

type TaskCategory = NonNullable<TaskNode['category']>;

const taskCategories: TaskCategory[] = ['BACKEND', 'FRONTEND', 'DEVOPS', 'TESTING', 'DOCUMENTATION', 'DESIGN', 'OTHER'];

const taskCategoryTagClass: Record<TaskCategory, string> = {
  BACKEND: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20 light:bg-indigo-500/10 light:text-indigo-700 light:border-indigo-500/20',
  FRONTEND: 'bg-pink-500/10 text-pink-300 border-pink-500/20 light:bg-pink-500/10 light:text-pink-700 light:border-pink-500/20',
  DEVOPS: 'bg-orange-500/10 text-orange-300 border-orange-500/20 light:bg-orange-500/10 light:text-orange-700 light:border-orange-500/20',
  TESTING: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 light:bg-emerald-500/10 light:text-emerald-700 light:border-emerald-500/20',
  DOCUMENTATION: 'bg-blue-500/10 text-blue-300 border-blue-500/20 light:bg-blue-500/10 light:text-blue-700 light:border-blue-500/20',
  DESIGN: 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20 light:bg-fuchsia-500/10 light:text-fuchsia-700 light:border-fuchsia-500/20',
  OTHER: 'bg-slate-500/10 text-slate-300 border-slate-500/20 light:bg-slate-100 light:text-slate-600 light:border-slate-200'
};

const taskFormFieldClass = 'w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm font-medium text-slate-100 outline-none transition-all duration-300 placeholder:text-slate-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 light:border-slate-200 light:bg-white light:text-slate-900 light:placeholder:text-slate-400 light:focus:border-brand-500 light:focus:ring-brand-500';

interface TaskCreatorProps {
  projectId: string;
  taskDraftPosition: TaskDraftPosition;
  mode: TaskCreatorMode;
  isClosing: boolean;
  onClose: () => void;
  onTaskCreated: (createdTask: TaskNode) => void;
  animationKey: number;
}

export function TaskCreator({
  projectId,
  taskDraftPosition,
  mode,
  isClosing,
  onClose,
  onTaskCreated,
  animationKey
}: TaskCreatorProps) {
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskCategory, setTaskCategory] = useState<TaskCategory>('OTHER');
  const [taskHours, setTaskHours] = useState('0.0');
  const [taskFormError, setTaskFormError] = useState<string | null>(null);
  const [taskFieldErrors, setTaskFieldErrors] = useState<{ title?: string; hours?: string }>({});
  const [creatingTask, setCreatingTask] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  const parseHoursValue = useCallback((value: string): number | null => {
    const normalized = value.trim().replace(',', '.');
    if (!normalized) return null;

    if (normalized.includes(':')) {
      const [hoursPart, minutesPart = '0'] = normalized.split(':');
      const hours = Number(hoursPart || 0);
      const minutes = Number(minutesPart || 0);

      if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours < 0 || minutes < 0 || minutes >= 60) {
        return Number.NaN;
      }

      return hours + minutes / 60;
    }

    return Number(normalized);
  }, []);

  const formatDecimalHours = useCallback((hours: number) => {
    if (!Number.isFinite(hours) || hours < 0) return '0.0';
    const fixed = hours.toFixed(2);
    const trimmed = fixed.replace(/0$/, '');
    return trimmed.includes('.') ? trimmed : `${trimmed}.0`;
  }, []);

  const formatHoursValue = useCallback((value: string) => {
    const normalized = value.trim().replace(',', '.');
    if (!normalized) return '0.0';

    if (normalized.includes(':')) {
      const [rawHours = '0', rawMinutes = '0'] = normalized.split(':');
      const hours = Number(rawHours || 0);
      const minutes = Number(rawMinutes || 0);

      if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours < 0 || minutes < 0 || minutes >= 60) {
        return '0.0';
      }

      return `${Math.floor(hours)}:${String(Math.floor(minutes)).padStart(2, '0')}`;
    }

    const parsed = Number(normalized);
    return formatDecimalHours(parsed);
  }, [formatDecimalHours]);

  const maskHoursValue = useCallback((value: string) => {
    const normalized = value.replace(',', '.');

    if (normalized.includes(':')) {
      const [rawHours = '', rawMinutes = ''] = normalized.split(':');
      const hours = rawHours.replace(/\D/g, '').slice(0, 4);
      const minutes = rawMinutes.replace(/\D/g, '').slice(0, 2);
      return `${hours || '0'}:${minutes}`;
    }

    const cleaned = normalized
      .replace(/[^0-9.]/g, '')
      .replace(/(\..*)\./g, '$1');

    const [rawInteger = '', rawDecimal] = cleaned.split('.');
    const integerPart = rawInteger.replace(/^0+(?=\d)/, '') || '0';

    if (rawDecimal !== undefined) {
      return `${integerPart}.${rawDecimal.slice(0, 2)}`;
    }

    return integerPart;
  }, []);

  const updateHoursByStep = useCallback((direction: 1 | -1) => {
    setTaskHours((current) => {
      const parsed = parseHoursValue(current);
      const next = Math.max(0, (parsed !== null && Number.isFinite(parsed) ? parsed : 0) + direction * 0.25);
      return formatDecimalHours(next);
    });
    setTaskFormError(null);
    setTaskFieldErrors((prev) => ({ ...prev, hours: undefined }));
  }, [formatDecimalHours, parseHoursValue]);

  const createTask = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();

    if (!projectId || !taskDraftPosition) return;

    const title = taskTitle.trim();
    const normalizedHours = parseHoursValue(taskHours);
    const nextFieldErrors: { title?: string; hours?: string } = {};

    if (!title) {
      nextFieldErrors.title = 'Task title is required.';
    }

    if (normalizedHours !== null && (!Number.isFinite(normalizedHours) || normalizedHours < 0)) {
      nextFieldErrors.hours = 'Enter valid hours.';
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setTaskFieldErrors(nextFieldErrors);
      setTaskFormError(null);
      return;
    }

    setCreatingTask(true);
    setTaskFormError(null);
    setTaskFieldErrors({});

    try {
      const createdTask = await projectsApi.createTask(projectId, {
        title,
        description: taskDescription.trim() || null,
        category: taskCategory,
        estimatedHours: normalizedHours,
        positionX: taskDraftPosition.flow.x,
        positionY: taskDraftPosition.flow.y
      });

      onTaskCreated(createdTask);

      setTaskTitle('');
      setTaskDescription('');
      setTaskCategory('OTHER');
      setTaskHours('0.0');
      setTaskFieldErrors({});
      setCategoryDropdownOpen(false);
    } catch (err) {
      const statusCode = axios.isAxiosError(err) ? err.response?.status : undefined;
      const parsed = mapServerErrorToEnglish(err, statusCode);
      setTaskFormError(parsed.message);
    } finally {
      setCreatingTask(false);
    }
  }, [projectId, taskDraftPosition, taskTitle, taskHours, taskDescription, taskCategory, parseHoursValue, onTaskCreated]);

  const categoryDropdownOpensUp = Boolean(
    taskDraftPosition &&
    typeof window !== 'undefined' &&
    taskDraftPosition.screen.y > window.innerHeight - 520
  );

  return (
    <>
      {mode === 'toolbar' && (
        <div
          className={`fixed inset-0 z-[60] backdrop-blur-[1px] light:bg-slate-900/5 transition-all duration-200 ${
            isClosing ? 'modal-overlay-exit' : 'animate-slow-fade bg-slate-950/20'
          }`}
          onPointerDown={onClose}
          aria-hidden="true"
        />
      )}
      <div
        key={`${mode}-${animationKey}`}
        className={`fixed z-[70] rounded-3xl p-4 text-slate-100 shadow-2xl backdrop-blur-2xl light:text-slate-900 ${
          isClosing ? 'modal-content-exit' : 'animate-zoom-in-fade'
        } ${
          mode === 'toolbar'
            ? 'w-[min(420px,calc(100vw-1.5rem))] border border-white/10 bg-[#020617]/75 shadow-black/10 light:border-slate-200/60 light:bg-white/80 light:shadow-slate-200/20'
            : 'w-[min(360px,calc(100vw-1.5rem))] border border-white/10 bg-[#020617]/85 shadow-black/25 light:border-slate-200/70 light:bg-white/90 light:shadow-slate-300/30'
        }`}
        style={mode === 'toolbar'
          ? { left: 'max(12px, calc(50vw - 210px))', top: 'max(112px, calc(50vh - 270px))' }
          : { left: taskDraftPosition.screen.x, top: taskDraftPosition.screen.y }
        }
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/25 bg-brand-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-300 light:text-brand-700">
              <Plus className="h-3 w-3" />
              {mode === 'toolbar' ? 'Create task' : 'New task'}
            </div>
            <p className="mt-2 text-xs text-slate-400 light:text-slate-600">
              {mode === 'toolbar'
                ? 'Create a task from the toolbar. It will be placed in the center of the current canvas view.'
                : 'Fill in the details and create a node on the graph.'}
            </p>
          </div>
        </div>

        <form className="space-y-3" onSubmit={createTask}>
          <div>
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 light:text-slate-500">
                Title
              </label>
              {taskFieldErrors.title && (
                <span className="animate-error-pop text-right text-[10px] font-medium leading-none text-red-400">{taskFieldErrors.title}</span>
              )}
            </div>
            <input
              value={taskTitle}
              onChange={(event) => {
                setTaskTitle(event.target.value);
                setTaskFormError(null);
                setTaskFieldErrors((prev) => ({ ...prev, title: undefined }));
              }}
              autoFocus
              placeholder="e.g. Build task creation UI"
              className={`${taskFormFieldClass} ${taskFieldErrors.title ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : ''}`}
              disabled={creatingTask}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500 light:text-slate-500">
              Description
            </label>
            <textarea
              value={taskDescription}
              onChange={(event) => setTaskDescription(event.target.value)}
              placeholder="Short task details"
              rows={3}
              className={`${taskFormFieldClass} resize-none`}
              disabled={creatingTask}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500 light:text-slate-500">
                Category
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => !creatingTask && setCategoryDropdownOpen((open) => !open)}
                  className={`${taskFormFieldClass} flex items-center justify-between gap-2 font-semibold`}
                  disabled={creatingTask}
                  aria-haspopup="listbox"
                  aria-expanded={categoryDropdownOpen}
                >
                  <span className={`max-w-[calc(100%-1.5rem)] truncate rounded-lg border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${taskCategoryTagClass[taskCategory]}`}>
                    {taskCategory}
                  </span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${categoryDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {categoryDropdownOpen && (
                  <div
                    className={`absolute left-0 right-0 z-[90] max-h-[min(19rem,calc(100vh-8rem))] overflow-y-auto rounded-xl border border-white/10 bg-slate-950/85 p-1.5 shadow-xl backdrop-blur-xl animate-dropdown-slide light:border-slate-200/80 light:bg-white/95 light:shadow-[0_10px_25px_-5px_rgba(15,23,42,0.08)] [scrollbar-width:thin] ${categoryDropdownOpensUp ? 'bottom-full mb-2 origin-bottom' : 'top-full mt-2 origin-top'}`}
                    role="listbox"
                  >
                    {taskCategories.map((category) => {
                      const active = taskCategory === category;
                      return (
                        <button
                          key={category}
                          type="button"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            setTaskCategory(category);
                            setCategoryDropdownOpen(false);
                          }}
                          className={`flex w-full items-center px-2.5 py-2 text-left transition-colors duration-200 cursor-pointer rounded-lg ${active
                            ? 'bg-white/5 light:bg-slate-50'
                            : 'hover:bg-white/5 light:hover:bg-slate-50'
                            }`}
                          role="option"
                          aria-selected={active}
                        >
                          <span className={`rounded-lg border px-2 py-1 text-[9px] font-bold uppercase tracking-wide ${taskCategoryTagClass[category]}`}>
                            {category}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div>
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 light:text-slate-500">
                  Hours
                </label>
                {taskFieldErrors.hours && (
                  <span className="animate-error-pop text-right text-[10px] font-medium leading-none text-red-400">{taskFieldErrors.hours}</span>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  inputMode="text"
                  value={taskHours}
                  placeholder="1.5 or 1:30"
                  onChange={(event) => {
                    setTaskHours(maskHoursValue(event.target.value));
                    setTaskFormError(null);
                    setTaskFieldErrors((prev) => ({ ...prev, hours: undefined }));
                  }}
                  onFocus={(event) => event.target.select()}
                  onBlur={() => setTaskHours((current) => formatHoursValue(current))}
                  className={`${taskFormFieldClass} pr-9 font-semibold tabular-nums ${taskFieldErrors.hours ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                  disabled={creatingTask}
                />
                <div className="absolute inset-y-1.5 right-1.5 flex w-6 flex-col overflow-hidden rounded-lg border border-white/10 bg-slate-900/70 light:border-slate-200/80 light:bg-slate-50">
                  <button
                    type="button"
                    onClick={() => updateHoursByStep(1)}
                    disabled={creatingTask}
                    className="flex flex-1 items-center justify-center text-slate-400 transition hover:bg-white/5 hover:text-brand-300 disabled:opacity-50 light:text-slate-500 light:hover:bg-white light:hover:text-brand-600"
                    aria-label="Increase estimated hours"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                  <div className="h-px bg-white/10 light:bg-slate-200" />
                  <button
                    type="button"
                    onClick={() => updateHoursByStep(-1)}
                    disabled={creatingTask}
                    className="flex flex-1 items-center justify-center text-slate-400 transition hover:bg-white/5 hover:text-brand-300 disabled:opacity-50 light:text-slate-500 light:hover:bg-white light:hover:text-brand-600"
                    aria-label="Decrease estimated hours"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {taskFormError && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300 light:text-red-700">
              {taskFormError}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={creatingTask}
              className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-white/5 hover:text-slate-200 disabled:opacity-50 light:text-slate-600 light:hover:bg-slate-950/5 light:hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creatingTask}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-brand-500 to-orange-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-brand-500/20 transition hover:shadow-brand-500/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {creatingTask ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

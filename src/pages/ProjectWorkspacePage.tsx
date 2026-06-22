import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AlertCircle, GitBranch, ShieldAlert, X } from 'lucide-react';
import { SafariTopBar } from '../components/common/SafariTopBar';
import { SafariBottomBar } from '../components/common/SafariBottomBar';
import {
  type WorkspaceNode,
  type TaskFlowEdge,
  type TaskFlowNode,
} from '../features/workspace/utils/workspaceUtils';
import { TaskNodeCard } from '../features/workspace/components/TaskNodeCard';
import { GradientEdge } from '../features/workspace/components/GradientEdge';
import { LayerHeaderNode } from '../features/workspace/components/LayerHeaderNode';
import { TopologicalLanesHeader } from '../features/workspace/components/TopologicalLanesHeader';
import { WorkspaceToolbar } from '../features/workspace/components/WorkspaceToolbar';
import { WorkspaceHeader } from '../features/workspace/components/WorkspaceHeader';
import { TaskCreator } from '../features/workspace/components/TaskCreator';
import { TaskDetailsSidebar } from '../features/workspace/components/TaskDetailsSidebar';
import { TaskStatusMenu } from '../features/workspace/components/TaskStatusMenu';
import { TaskActionsModal } from '../features/workspace/components/TaskActionsModal';
import { ConfirmModal } from '../features/workspace/components/ConfirmModal';
import { TeamModal } from '../features/workspace/components/TeamModal';
import { InviteMemberModal } from '../features/workspace/components/InviteMemberModal';
import { useWorkspace } from '../features/workspace/hooks/useWorkspace';
import { ActionLogPanel } from '../features/workspace/components/ActionLogPanel';

export default function ProjectWorkspacePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const workspace = useWorkspace(projectId);

  const nodeTypes = useMemo(() => ({
    taskNode: (props: any) => <TaskNodeCard {...props} theme={workspace.theme} />,
    layerHeader: LayerHeaderNode
  }), [workspace.theme]);

  const edgeTypes = useMemo(() => ({ gradient: GradientEdge }), []);

  return (
    <div className="relative min-h-screen bg-slate-950 light:bg-[#f1f5f9] text-slate-100 light:text-slate-900 flex flex-col font-sans transition-colors duration-300">
      <SafariTopBar />
      <SafariBottomBar />

      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 animate-slow-fade hidden md:block">
        <div className="absolute inset-[-30%] h-[160%] w-[160%] animate-[spin_200s_linear_infinite] opacity-[0.85] mix-blend-normal">
          <div className="absolute top-[20%] left-[15%] h-[55vw] min-h-[650px] w-[55vw] min-w-[650px] animate-blob-one rounded-full bg-indigo-600/10 blur-[180px] light:bg-indigo-500/5" />
          <div className="absolute top-[15%] right-[15%] h-[65vw] min-h-[750px] w-[65vw] min-w-[750px] animate-blob-two rounded-full bg-purple-600/8 blur-[200px] light:bg-purple-500/4" />
          <div className="absolute bottom-[20%] left-[20%] h-[55vw] min-h-[650px] w-[55vw] min-w-[650px] animate-blob-three rounded-full bg-blue-600/8 blur-[180px] light:bg-blue-500/4" />
          <div className="absolute bottom-[15%] right-[15%] h-[60vw] min-h-[700px] w-[60vw] min-w-[700px] animate-blob-four rounded-full bg-amber-500/5 blur-[190px] light:bg-amber-400/3" />
        </div>
      </div>

      <svg className="fixed inset-0 z-1 hidden h-full w-full animate-slow-fade mix-blend-overlay opacity-[0.05] pointer-events-none light:opacity-[0.02] md:block">
        <filter id="workspaceNoiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.8 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#workspaceNoiseFilter)" />
      </svg>

      <WorkspaceHeader
        project={workspace.project}
        graph={workspace.graph}
        loading={workspace.loading}
        refreshing={workspace.refreshing}
        theme={workspace.theme}
        toggleTheme={workspace.toggleTheme}
        onRefresh={() => workspace.loadWorkspace(true)}
        onOpenTeam={workspace.openTeamModal}
        onOpenActionLog={workspace.openActionLog}
        isScrolled={workspace.isScrolled}
      />

      <main className="relative z-20 mx-auto flex w-full max-w-none flex-1 flex-col gap-4 px-2 pb-4 pt-0 sm:px-3 lg:px-4">
        {workspace.loading ? (
          <div className="flex min-h-[60vh] items-center justify-center rounded-3xl border border-white/10 bg-[#020617]/70 backdrop-blur-xl shadow-lg shadow-black/10 light:border-slate-200/60 light:bg-white/75 light:shadow-slate-200/10 animate-zoom-in-fade">
            <div className="flex flex-col items-center gap-4">
              <div className="relative h-12 w-12">
                <div className="absolute inset-0 rounded-full border-4 border-brand-500/20" />
                <div className="absolute inset-0 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
              </div>
              <span className="text-sm font-medium text-slate-400 light:text-slate-600 animate-pulse">Loading project graph...</span>
            </div>
          </div>
        ) : workspace.error ? (
          <div className="flex min-h-[60vh] items-center justify-center rounded-3xl border border-red-500/20 bg-[#020617]/70 p-6 text-center backdrop-blur-xl shadow-lg shadow-black/10 light:bg-white/75 light:border-red-500/30 light:shadow-slate-200/10 animate-zoom-in-fade">
            <div className="flex max-w-md flex-col items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-red-300 light:text-red-700">Failed to load workspace</h2>
                <p className="mt-1 text-sm text-red-200/80 light:text-red-700/80">{workspace.error}</p>
              </div>
              <button
                onClick={() => workspace.loadWorkspace()}
                className="rounded-xl border border-white/10 bg-[#020617]/70 backdrop-blur-md px-4 py-2 text-sm font-semibold text-red-300 transition-colors hover:bg-slate-800/80 light:bg-slate-100/80 light:border-slate-200/80 light:text-red-600 light:hover:bg-slate-50"
              >
                Try again
              </button>
            </div>
          </div>
        ) : (
          <>
            <section className="contents">
              <div className="fixed inset-0 z-10 overflow-hidden bg-transparent animate-header-fade-in">
                <div className="workspace-flow-surface absolute inset-0 pointer-events-none" />
                <div className="workspace-flow-vignette absolute inset-0 pointer-events-none" />

                {!workspace.graph || workspace.graph.nodes.length === 0 ? (
                  <div className="relative z-10 flex h-full min-h-dvh items-center justify-center p-8 text-center animate-zoom-in-fade">
                    <div className="max-w-sm flex flex-col items-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-[#020617]/70 text-slate-400 backdrop-blur-xl shadow-lg shadow-black/10 light:border-slate-200/60 light:bg-white/75 light:text-slate-500 light:shadow-slate-200/10">
                        <ShieldAlert className="h-7 w-7" />
                      </div>
                      <h2 className="mt-4 text-lg font-bold text-white light:text-slate-900">This project has no tasks yet</h2>
                      <p className="mt-2 text-sm text-slate-400 light:text-slate-600">
                        The task graph hasn't been built yet. Try refreshing the page in a few seconds.
                      </p>
                    </div>
                  </div>
                ) : (
                  <ReactFlowProvider>
                    <ReactFlow<WorkspaceNode, TaskFlowEdge>
                      nodes={workspace.nodes}
                      edges={workspace.displayEdges}
                      nodeTypes={nodeTypes}
                      edgeTypes={edgeTypes}
                      onNodesChange={workspace.onNodesChange}
                      onEdgesChange={workspace.onEdgesChange}
                      onConnect={workspace.handleConnect}
                      onConnectStart={workspace.handleConnectStart}
                      onConnectEnd={workspace.handleConnectEnd}
                      onReconnect={workspace.handleReconnect}
                      onReconnectStart={workspace.handleReconnectStart}
                      onReconnectEnd={workspace.handleReconnectEnd}
                      isValidConnection={workspace.isValidConnection}
                      connectionLineStyle={workspace.connectionHint?.variant === 'error'
                        ? { stroke: '#ef4444', strokeWidth: 2.6, strokeDasharray: '6 6' }
                        : workspace.connectionHint?.variant === 'success'
                          ? { stroke: '#22c55e', strokeWidth: 2.6 }
                          : { stroke: workspace.theme === 'light' ? '#d97706' : '#f59e0b', strokeWidth: 2.2 }
                      }
                      onNodeClick={workspace.handleNodeClick}
                      onNodeContextMenu={workspace.handleNodeContextMenu}
                      onSelectionChange={workspace.handleSelectionChange}
                      onNodeDragStart={workspace.handleNodeDragStart}
                      onNodeDrag={workspace.handleNodeDrag}
                      onNodeDragStop={workspace.handleNodeDrag}
                      onInit={workspace.setFlowInstance}
                      onPaneContextMenu={workspace.handlePaneContextMenu}
                      onPaneClick={workspace.handlePaneClick}
                      onEdgeClick={workspace.handleEdgeClick}
                      onEdgeMouseEnter={workspace.handleEdgeMouseEnter}
                      onEdgeMouseLeave={workspace.handleEdgeMouseLeave}
                      fitView
                      fitViewOptions={{ padding: 0.2 }}
                      minZoom={0.2}
                      maxZoom={2}
                      proOptions={{ hideAttribution: true }}
                      colorMode={workspace.theme}
                      className="taskgraph-flow bg-transparent [&_.react-flow__attribution]:!bg-slate-900/70 [&_.react-flow__attribution]:!text-slate-500 light:[&_.react-flow__attribution]:!bg-white/80 light:[&_.react-flow__attribution]:!text-slate-500"
                    >
                      <Background
                        color={workspace.theme === 'light' ? 'rgba(100,116,139,0.26)' : 'rgba(148,163,184,0.18)'}
                        gap={22}
                        size={0.9}
                        className="opacity-35 light:opacity-30"
                      />
                      <MiniMap
                        position="bottom-left"
                        zoomable
                        pannable
                        nodeStrokeWidth={3}
                        bgColor="transparent"
                        className="taskgraph-corner-minimap !hidden lg:!block !mb-[66px] !ml-4 !rounded-2xl border border-white/10 !bg-[#020617]/70 backdrop-blur-xl shadow-lg shadow-black/10 light:border-slate-200/60 light:!bg-white/75 light:shadow-slate-200/10 [&_.react-flow__minimap-mask]:!stroke-white/10 light:[&_.react-flow__minimap-mask]:!stroke-slate-200 animate-slide-up-fade [animation-delay:150ms]"
                        nodeColor={(node) => {
                          if (node.type === 'layerHeader') return 'transparent';
                          const taskNode = node as TaskFlowNode;
                          const status = taskNode.data.task.status;

                          if (status === 'IN_PROGRESS') return workspace.theme === 'light' ? 'rgba(245, 158, 11, 0.75)' : 'rgba(251, 191, 36, 0.8)';
                          if (status === 'COMPLETED') return workspace.theme === 'light' ? 'rgba(16, 185, 129, 0.75)' : 'rgba(52, 211, 153, 0.8)';
                          if (status === 'LOCKED') return workspace.theme === 'light' ? 'rgba(148, 163, 184, 0.45)' : 'rgba(71, 85, 105, 0.55)';
                          return workspace.theme === 'light' ? 'rgba(79, 70, 229, 0.55)' : 'rgba(99, 102, 241, 0.7)';
                        }}
                        maskColor={workspace.theme === 'light' ? 'rgba(241, 245, 249, 0.5)' : 'rgba(2, 6, 23, 0.6)'}
                        style={{ width: 140, height: 100 }}
                      />
                      <Controls
                        position="bottom-left"
                        orientation="horizontal"
                        className="taskgraph-corner-controls !hidden lg:!flex !mb-6 !ml-4 overflow-hidden !rounded-2xl border border-white/10 !bg-[#020617]/70 backdrop-blur-xl shadow-lg shadow-black/10 light:border-slate-200/60 light:!bg-white/75 light:shadow-slate-200/10 animate-slide-up-fade [animation-delay:150ms]"
                      />
                      <WorkspaceToolbar
                        viewMode={workspace.viewMode}
                        setViewMode={workspace.setViewMode}
                        edgeType={workspace.edgeType}
                        setEdgeType={workspace.setEdgeType}
                        showTopologicalLanes={workspace.showTopologicalLanes}
                        setShowTopologicalLanes={workspace.setShowTopologicalLanes}
                        isAligned={workspace.isAligned}
                        autoArrangeLayout={workspace.autoArrangeLayout}
                        onCreateTask={() => workspace.openTaskCreator(undefined, undefined, 'toolbar')}
                        onTaskActions={() => {
                          if (workspace.selectedTaskId) {
                            workspace.openTaskActionsModal(workspace.selectedTaskId);
                          }
                        }}
                        onDeleteTask={() => {
                          if (workspace.selectedTaskId) {
                            workspace.handleDeleteTask(workspace.selectedTaskId);
                          }
                        }}
                        graphStats={workspace.graphStats}
                        undo={workspace.undo}
                        redo={workspace.redo}
                        canUndo={workspace.canUndo}
                        canRedo={workspace.canRedo}
                        onMutate={workspace.handleMutateGraph}
                        isTaskSidebarOpen={workspace.isTaskSidebarOpen}
                        isTaskSelected={Boolean(workspace.selectedTaskId) && !workspace.statusMenu}
                      />
                      {workspace.taskDraftPosition && projectId && (
                        <TaskCreator
                          projectId={projectId}
                          taskDraftPosition={workspace.taskDraftPosition}
                          mode={workspace.taskCreatorMode}
                          isClosing={workspace.isClosing}
                          onClose={workspace.closeTaskCreator}
                          onTaskCreated={workspace.handleTaskCreated}
                          animationKey={workspace.taskCreatorAnimationKey}
                        />
                      )}

                      {workspace.isTaskSidebarOpen && workspace.selectedTask && (
                        <TaskDetailsSidebar
                          task={workspace.selectedTask}
                          members={workspace.members}
                          currentUserId={workspace.currentUserId}
                          onClose={workspace.closeSidebarOnly}
                          onTaskUpdate={workspace.handleTaskUpdate}
                          onAssigneesChange={workspace.handleAssigneesChange}
                          onTimeLogDelete={workspace.handleDeleteTimeLog}
                          onInteract={() => workspace.setStatusMenu(null)}
                          updating={workspace.statusUpdatingTaskId === workspace.selectedTask.id}
                          isClosing={workspace.isTaskSidebarClosing}
                          isEnriching={workspace.isPolling}
                        />
                      )}

                      {workspace.taskActionsModalTask && (
                        <TaskActionsModal
                          task={workspace.taskActionsModalTask}
                          isClosing={workspace.isActionsModalClosing}
                          onClose={workspace.closeTaskActionsModal}
                          onStatusChange={workspace.handleTaskStatusChange}
                          onLogTime={(data) => workspace.handleLogTaskTime(workspace.taskActionsModalTask!, data)}
                          updating={workspace.statusUpdatingTaskId === workspace.taskActionsModalTask.id}
                          animationKey={workspace.actionsModalAnimationKey}
                        />
                      )}

                      {workspace.statusMenu && workspace.statusMenuTask && (
                        <TaskStatusMenu
                          task={workspace.statusMenuTask}
                          screen={workspace.statusMenu.screen}
                          onClose={() => workspace.setStatusMenu(null)}
                          onStatusChange={workspace.handleTaskStatusChange}
                          onLogTime={(data) => workspace.handleLogTaskTime(workspace.statusMenuTask!, data)}
                          updating={workspace.statusUpdatingTaskId === workspace.statusMenuTask.id}
                        />
                      )}

                      {workspace.connectionHint && (
                        <div
                          className={`pointer-events-none fixed z-[85] max-w-[260px] rounded-2xl border px-3 py-2 text-xs font-semibold shadow-2xl backdrop-blur-2xl transition-colors duration-200 ${workspace.connectionHint.closing ? 'connection-hint-exit' : 'connection-hint-enter'} ${workspace.connectionHint.variant === 'error'
                            ? 'border-red-500/25 bg-red-500/15 text-red-100 shadow-red-950/15 light:bg-red-50/95 light:text-red-700 light:shadow-red-200/30'
                            : workspace.connectionHint.variant === 'success'
                              ? 'border-emerald-500/25 bg-emerald-500/15 text-emerald-100 shadow-emerald-950/15 light:bg-emerald-50/95 light:text-emerald-700 light:shadow-emerald-200/30'
                              : 'border-brand-500/25 bg-[#020617]/80 text-brand-100 shadow-black/20 light:bg-white/90 light:text-brand-700 light:shadow-slate-300/25'
                            }`}
                          style={{
                            left: Math.min(workspace.connectionHint.x + 14, window.innerWidth - 280),
                            top: Math.min(workspace.connectionHint.y + 14, window.innerHeight - 90)
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {workspace.connectionHint.variant === 'error' ? <AlertCircle className="h-4 w-4 shrink-0" /> : <GitBranch className="h-4 w-4 shrink-0" />}
                            <span>{workspace.connectionHint.message}</span>
                          </div>
                        </div>
                      )}

                      {workspace.edgeToast && (
                        <div className={`fixed left-1/2 -translate-x-1/2 top-[108px] z-[80] max-w-[min(380px,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-[#020617]/92 px-4 py-3 pr-11 text-sm text-slate-100 shadow-xl shadow-black/20 backdrop-blur-2xl light:border-slate-200/70 light:bg-white/95 light:text-slate-900 light:shadow-slate-300/30 ${workspace.edgeToast.closing ? 'toast-exit' : 'animate-slide-down-fade'}`}>
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border ${workspace.edgeToast.variant === 'success'
                              ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300 light:text-emerald-700'
                              : 'border-red-500/25 bg-red-500/10 text-red-300 light:text-red-700'
                              }`}>
                              {workspace.edgeToast.variant === 'success' ? <GitBranch className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                            </div>
                            <div className="pr-1">
                              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 light:text-slate-500">
                                {workspace.edgeToast.variant === 'success' ? 'Workspace updated' : 'Workspace error'}
                              </div>
                              <p className="mt-0.5 text-[13px] leading-snug text-slate-200 light:text-slate-700">{workspace.edgeToast.message}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => workspace.closeEdgeToast(workspace.edgeToast!.id)}
                            className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/5 hover:text-slate-200 light:hover:bg-slate-950/5 light:hover:text-slate-900"
                            aria-label="Close notification"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}

                      <TopologicalLanesHeader
                        show={workspace.showTopologicalLanes}
                        columnWidth={400}
                        viewMode={workspace.viewMode}
                        uniqueLayers={workspace.uniqueLayers}
                        nodes={workspace.nodes}
                      />
                    </ReactFlow>
                  </ReactFlowProvider>
                )}
              </div>
            </section>
          </>
        )}
      </main>

      {workspace.confirmModal && (
        <ConfirmModal
          isOpen={true}
          isClosing={workspace.isConfirmClosing}
          title={workspace.confirmModal.title}
          message={workspace.confirmModal.message}
          isDestructive={workspace.confirmModal.isDestructive}
          onConfirm={workspace.confirmModal.onConfirm}
          onCancel={() => {
            workspace.setIsConfirmClosing(true);
            setTimeout(() => {
              workspace.setConfirmModal(null);
              workspace.setIsConfirmClosing(false);
            }, 200);
          }}
        />
      )}

      <TeamModal
        isOpen={workspace.isTeamOpen}
        isClosing={workspace.isTeamClosing}
        onClose={workspace.closeTeamModal}
        members={workspace.members}
        currentUserId={workspace.currentUserId}
        onRoleChange={workspace.handleRoleChange}
        onRemoveMember={workspace.handleRemoveMember}
        onOpenInvite={workspace.openInviteModal}
      />

      <InviteMemberModal
        isOpen={workspace.isInviteOpen}
        isClosing={workspace.isInviteClosing}
        onClose={workspace.closeInviteModal}
        onInvite={workspace.handleInviteMember}
      />

      <ActionLogPanel
        projectId={projectId || ''}
        isOpen={workspace.isActionLogOpen}
        isClosing={workspace.isActionLogClosing}
        onClose={workspace.closeActionLog}
        actionLogs={workspace.actionLogs}
        loading={workspace.loadingActionLogs}
        error={workspace.actionLogError}
        onReload={workspace.loadActionLogs}
      />
    </div>
  );
}

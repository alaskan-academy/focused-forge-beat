import { useState } from 'react';
import { useProjects, useCreateProject, useUpdateProject } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { Plus, Pencil } from 'lucide-react';
import TaskModal from '@/components/TaskModal';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import StatusBadge from '@/components/StatusBadge';

const projectColors = ['#6366f1', '#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

interface ProjectFormState {
  id?: string;
  name: string;
  color: string;
  status: string;
}

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();
  const { data: tasks } = useTasks();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const [modalOpen, setModalOpen] = useState(false);
  const [editProject, setEditProject] = useState<ProjectFormState | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskModalKey, setTaskModalKey] = useState(0);
  const [editTaskData, setEditTaskData] = useState<any>(null);

  const isEdit = !!editProject?.id;

  const openCreate = () => {
    setEditProject({ name: '', color: '#6366f1', status: 'active' });
    setModalOpen(true);
  };

  const openEdit = (p: { id: string; name: string; color: string; status: string }) => {
    setEditProject({ id: p.id, name: p.name, color: p.color, status: p.status });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProject || !editProject.name.trim()) return;
    try {
      if (isEdit) {
        await updateProject.mutateAsync({ id: editProject.id!, name: editProject.name.trim(), color: editProject.color, status: editProject.status });
        toast.success('Projeto atualizado!');
      } else {
        await createProject.mutateAsync({ name: editProject.name.trim(), color: editProject.color, status: editProject.status });
        toast.success('Projeto criado!');
      }
      setModalOpen(false);
      setEditProject(null);
    } catch {
      toast.error('Erro ao salvar projeto');
    }
  };

  const getProjectProgress = (projectId: string) => {
    const projectTasks = tasks?.filter((t) => t.project_id === projectId) || [];
    if (projectTasks.length === 0) return 0;
    const done = projectTasks.filter((t) => t.status === 'done').length;
    return Math.round((done / projectTasks.length) * 100);
  };

  const getProjectTaskCount = (projectId: string) => {
    return tasks?.filter((t) => t.project_id === projectId).length || 0;
  };

  const selectedTasks = selectedProject ? tasks?.filter((t) => t.project_id === selectedProject) : null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Projetos</h1>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Projeto
        </Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-center py-12">Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects?.map((p) => {
            const progress = getProjectProgress(p.id);
            const taskCount = getProjectTaskCount(p.id);
            return (
              <div
                key={p.id}
                onClick={() => setSelectedProject(selectedProject === p.id ? null : p.id)}
                className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:border-primary/30 transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                  <h3 className="font-semibold text-foreground flex-1">{p.name}</h3>
                  <button
                    onClick={(e) => { e.stopPropagation(); openEdit(p); }}
                    className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity bg-secondary text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <Select
                    value={p.status}
                    onValueChange={(v) => { updateProject.mutate({ id: p.id, status: v }); }}
                  >
                    <SelectTrigger className="w-24 h-7 text-xs bg-secondary border-border" onClick={(e) => e.stopPropagation()}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="paused">Pausado</SelectItem>
                      <SelectItem value="done">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                  <span>{taskCount} tarefas</span>
                  <span>{progress}% concluído</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: p.color }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedProject && selectedTasks && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold text-foreground mb-4">
            Tarefas do Projeto: {projects?.find((p) => p.id === selectedProject)?.name}
          </h2>
          {selectedTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma tarefa neste projeto</p>
          ) : (
            <div className="space-y-2">
              {selectedTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => { setEditTaskData(t); setTaskModalKey(k => k + 1); setTaskModalOpen(true); }}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 cursor-pointer hover:bg-secondary transition-colors"
                >
                  <span className="text-sm text-foreground">{t.name}</span>
                  <StatusBadge status={t.status || 'todo'} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) { setModalOpen(false); setEditProject(null); } }}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{isEdit ? 'Editar Projeto' : 'Novo Projeto'}</DialogTitle>
          </DialogHeader>
          {editProject && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input
                  value={editProject.name}
                  onChange={(e) => setEditProject({ ...editProject, name: e.target.value })}
                  placeholder="Nome do projeto"
                  className="bg-secondary border-border"
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={editProject.status} onValueChange={(v) => setEditProject({ ...editProject, status: v })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="paused">Pausado</SelectItem>
                    <SelectItem value="done">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cor</Label>
                <div className="flex gap-2 mt-1">
                  {projectColors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditProject({ ...editProject, color: c })}
                      className="w-8 h-8 rounded-full border-2 transition-all"
                      style={{ backgroundColor: c, borderColor: editProject.color === c ? 'white' : 'transparent' }}
                    />
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full">
                {isEdit ? 'Salvar' : 'Criar Projeto'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

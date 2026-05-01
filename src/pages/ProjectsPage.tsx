import { useState } from 'react';
import { useProjects, useCreateProject, useUpdateProject } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { Plus, FolderKanban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import StatusBadge from '@/components/StatusBadge';

const projectColors = ['#6366f1', '#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();
  const { data: tasks } = useTasks();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [status, setStatus] = useState('active');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createProject.mutateAsync({ name: name.trim(), color, status });
      setModalOpen(false);
      setName('');
      toast.success('Projeto criado!');
    } catch {
      toast.error('Erro ao criar projeto');
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
        <Button onClick={() => setModalOpen(true)} className="gap-2">
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
                className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:border-primary/30 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                  <h3 className="font-semibold text-foreground flex-1">{p.name}</h3>
                  <Select
                    value={p.status}
                    onValueChange={(v) => {
                      updateProject.mutate({ id: p.id, status: v });
                    }}
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
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${progress}%`, backgroundColor: p.color }}
                  />
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
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <span className="text-sm text-foreground">{t.name}</span>
                  <StatusBadge status={t.status || 'todo'} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Novo Projeto</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do projeto" className="bg-secondary border-border" />
            </div>
            <div>
              <Label>Cor</Label>
              <div className="flex gap-2 mt-1">
                {projectColors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="w-8 h-8 rounded-full border-2 transition-all"
                    style={{ backgroundColor: c, borderColor: color === c ? 'white' : 'transparent' }}
                  />
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full">Criar Projeto</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

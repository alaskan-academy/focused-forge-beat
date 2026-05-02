import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TaskModal from '@/components/TaskModal';

export default function FloatingAddTaskButton() {
  const [open, setOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);

  return (
    <>
      <Button
        onClick={() => { setModalKey((k) => k + 1); setOpen(true); }}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg p-0"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>
      <TaskModal key={modalKey} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

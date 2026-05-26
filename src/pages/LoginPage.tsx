import { FormEvent, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckSquare, Mail, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      await signInWithEmail(email.trim());
      setSent(true);
    } catch (err: any) {
      setError(err?.message || 'Erro ao enviar o link. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-2">
            <CheckSquare className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">TaskFlow</h1>
          <p className="text-sm text-muted-foreground">Organize suas tarefas do dia a dia</p>
        </div>

        {sent ? (
          /* Sent state */
          <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground">Verifique seu email</h2>
            <p className="text-sm text-muted-foreground">
              Enviamos um link de acesso para <strong className="text-foreground">{email}</strong>.
              <br />Clique no link para entrar.
            </p>
            <button
              onClick={() => { setSent(false); setEmail(''); }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
            >
              Usar outro email
            </button>
          </div>
        ) : (
          /* Email form */
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="space-y-1">
              <h2 className="font-semibold text-foreground">Entrar</h2>
              <p className="text-sm text-muted-foreground">
                Insira seu email e enviaremos um link mágico para acessar.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-secondary border-border"
                autoFocus
                required
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button type="submit" className="w-full gap-2" disabled={loading || !email.trim()}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Enviar link de acesso
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Acesso seguro via magic link — sem senhas para lembrar.
        </p>
      </div>
    </div>
  );
}

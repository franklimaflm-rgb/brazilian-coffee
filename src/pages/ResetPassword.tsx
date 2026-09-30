import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Coffee, Lock, Mail } from 'lucide-react';

// Read error info the backend appends to the link (e.g. expired / already used).
const readLinkError = (): string | null => {
  try {
    const params = new URLSearchParams(
      (window.location.hash || '').replace(/^#/, '') + '&' + (window.location.search || '').replace(/^\?/, '')
    );
    const code = params.get('error_code');
    const desc = params.get('error_description');
    if (!code && !desc) return null;
    if (code === 'otp_expired') {
      return 'Este link expirou ou já foi usado. Peça um novo link abaixo.';
    }
    return desc ? decodeURIComponent(desc.replace(/\+/g, ' ')) : 'Link inválido. Peça um novo link abaixo.';
  } catch {
    return null;
  }
};

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [linkError, setLinkError] = useState<string | null>(() => readLinkError());
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        setReady(true);
        setLinkError(null);
        setChecking(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady(true);
        setLinkError(null);
      }
    });

    // Give the backend a moment to process the link before showing the fallback.
    const timer = setTimeout(() => setChecking(false), 2500);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({ title: 'Senha muito curta', description: 'Use pelo menos 6 caracteres.', variant: 'destructive' });
      return;
    }
    if (password !== confirm) {
      toast({ title: 'As senhas não coincidem', description: 'Digite a mesma senha nos dois campos.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsLoading(false);

    if (error) {
      const msg = /weak|pwned|leaked|compromised/i.test(error.message)
        ? 'Essa senha é muito comum ou já apareceu em vazamentos. Escolha outra.'
        : /different from the old/i.test(error.message)
          ? 'A nova senha precisa ser diferente da atual.'
          : error.message;
      toast({ title: 'Não foi possível alterar a senha', description: msg, variant: 'destructive' });
      return;
    }

    toast({ title: 'Senha alterada', description: 'Pronto! Você já está conectado com a nova senha.' });
    navigate('/');
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(clean)) {
      toast({ title: 'E-mail inválido', description: 'Digite o e-mail da sua conta.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(clean, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsLoading(false);
    if (error) {
      const msg = /rate limit|security purposes/i.test(error.message)
        ? 'Muitos pedidos seguidos. Aguarde alguns minutos e tente de novo.'
        : error.message;
      toast({ title: 'Não foi possível enviar o link', description: msg, variant: 'destructive' });
      return;
    }
    toast({
      title: 'Link enviado',
      description: 'Confira sua caixa de entrada (e o spam). Abra o link mais recente no mesmo navegador.',
    });
  };

  const showResend = !ready && !checking;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50 shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Coffee className="w-8 h-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Criar nova senha</CardTitle>
            <CardDescription className="mt-2">
              {ready
                ? 'Escolha uma nova senha para a sua conta.'
                : checking
                  ? 'Verificando seu link...'
                  : linkError ?? 'Para trocar a senha, peça um link de recuperação pelo seu e-mail.'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {ready ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Salvando...' : 'Salvar nova senha'}
              </Button>
            </form>
          ) : showResend ? (
            <form onSubmit={handleResend} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Seu e-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    placeholder="voce@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Enviando...' : 'Enviar novo link'}
              </Button>
            </form>
          ) : null}

          <Button type="button" variant="ghost" className="w-full mt-2" onClick={() => navigate('/auth')}>
            Voltar para o login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;

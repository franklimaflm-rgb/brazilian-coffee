## Adicionar tema escuro

O projeto já tem todas as variáveis CSS de dark mode definidas em `src/index.css` (`.dark { ... }`) e o Tailwind está configurado com `darkMode: ["class"]`. Falta apenas a infraestrutura para alternar e persistir o tema.

### Etapas

1. **Provider de tema**
   - Criar `src/components/ThemeProvider.tsx` (provider leve, sem dependência nova) que:
     - Lê preferência salva em `localStorage` (`theme`) ou usa `prefers-color-scheme`.
     - Aplica/remova a classe `dark` em `document.documentElement`.
     - Expõe `useTheme()` com `theme` e `setTheme('light' | 'dark' | 'system')`.

2. **Integrar no app**
   - Envolver a árvore em `src/App.tsx` com `<ThemeProvider defaultTheme="system">` (acima do `LanguageProvider`).

3. **Botão de alternância**
   - Criar `src/components/ThemeToggle.tsx` com ícones `Sun` / `Moon` (lucide-react) usando o `Button` (variant `ghost`, size `icon`).
   - Inserir o toggle no `src/components/Navigation.tsx` ao lado do `LanguageSelector` (desktop e mobile sheet).

4. **Traduções**
   - Adicionar chaves `theme.light`, `theme.dark`, `theme.toggle` em `src/i18n/translations.ts` (PT/EN/ES, conforme idiomas existentes) para `aria-label` do botão.

5. **Anti-flash**
   - Adicionar pequeno script inline em `index.html` (`<head>`) que aplica a classe `dark` antes do React montar, evitando flash branco no carregamento.

### Detalhes técnicos

- Sem novas dependências; aproveitamos os tokens HSL já existentes em `index.css`.
- `next-themes` não será adicionado para manter o bundle enxuto (o `sonner.tsx` já o importa, mas funciona com `theme="system"` lendo a classe do `<html>`; nada a alterar lá).
- Nenhuma mudança de lógica de negócio, somente apresentação.

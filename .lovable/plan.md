## Diagnóstico

O erro 400 vem do host `jzqymlazswolzsoffpgi.supabase.co`, que **não é** o backend atual deste projeto. O `.env` e `src/integrations/supabase/client.ts` apontam corretamente para `ymsqqetstluhxmrkugvg.supabase.co`. O host antigo só aparece em arquivos de documentação (`CONSOLE_FIXES.md`).

Causa: o app tem PWA ativado (`vite-plugin-pwa` com `registerType: 'autoUpdate'` e `devOptions.enabled: true`). Um Service Worker antigo, registrado numa build anterior que apontava para o backend errado, ainda está servindo HTML/JS em cache no navegador — por isso o login tenta o domínio Supabase antigo e recebe 400.

## Plano

1. **Adicionar uma rotina de "kill switch" do SW antigo** em `src/main.tsx` (executa cedo, antes do React montar):
   - Se houver `navigator.serviceWorker`, listar registros, desregistrar todos.
   - Limpar `caches.keys()` → `caches.delete(...)`.
   - Marcar `localStorage['sw-reset-v1'] = '1'` para rodar só uma vez por navegador e evitar loop.
   - Se algo foi limpo, fazer `location.reload()` para carregar o bundle novo já com o backend correto.

2. **Desativar o SW em desenvolvimento** em `vite.config.ts`:
   - `devOptions.enabled: false` (mantém PWA só no build de produção). Isso evita o `dev-dist/sw.js` cachear o app durante o trabalho no preview.

3. **Limpar referências obsoletas em docs** (não afeta runtime, mas evita confusão futura):
   - Remover/atualizar URLs antigas (`jzqymlazswolzsoffpgi`, `eticmvmetfpijbavteel`) em `CONSOLE_FIXES.md`, `README.md`, `SUPABASE_400_ERROR_RESOLUTION_REPORT.md`, `ADMIN_PANEL_FIXES_REPORT.md`, `database-setup.md`.

4. **Verificar**: após o reload automático, o login no `/admin` deve bater em `ymsqqetstluhxmrkugvg.supabase.co/auth/v1/token`. Se as credenciais estiverem corretas, retorna 200; um 400 nesse host significaria apenas senha inválida, não cache.

## Observação

Não é necessário mexer no client Supabase nem em variáveis de ambiente — eles já estão certos. O problema é puramente cache do Service Worker no navegador do usuário.
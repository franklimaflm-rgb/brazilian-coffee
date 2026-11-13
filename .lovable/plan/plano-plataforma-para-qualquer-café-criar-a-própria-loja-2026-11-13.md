# Plano: Plataforma para qualquer café criar a própria loja

## Objetivo
Um dono de café que chega pelo LinkedIn cria uma conta, monta a própria loja (nome, logo, cardápio, preços, horários, taxa de entrega) e recebe um link próprio, sem precisar falar com vocês. Para quem quiser ajuda, o site tem um formulário de contato. O uso é gratuito por enquanto. A Brazilian Coffee Academy continua funcionando como a loja real de vocês e passa a ser a primeira loja da plataforma.

## Como fica para o dono do café
```text
Página da plataforma -> "Criar minha loja" -> Cadastro (e-mail ou Google)
  -> Assistente: nome, endereço, logo, cores, WhatsApp
  -> Cardápio: adicionar produtos e preços
  -> Horários, taxa de entrega, pedido mínimo
  -> Loja no ar em  brazilian-coffee.lovable.app/loja/nome-do-cafe
  -> Painel próprio: só vê os pedidos e clientes da loja dele
```

## Etapas
1. **Página da plataforma** (nova página inicial de apresentação): explica o produto, tem o botão "Criar minha loja grátis" e o formulário "Fale conosco". A loja de vocês continua com o mesmo endereço de hoje.
2. **Formulário de contato**: guarda cada mensagem (nome, café, e-mail, telefone, mensagem) e mostra as mensagens no painel de vocês. Para receber essas mensagens também por e-mail, vocês precisam de um domínio verificado. Até lá, elas ficam salvas no painel.
3. **Lojas separadas**: cada café passa a ser uma "loja" com dados próprios: produtos, pedidos, clientes, indicações e configurações. Os dados atuais passam a pertencer à loja Brazilian Coffee Academy, sem perder nada. Os pedidos de teste e as contas existentes são mantidos.
4. **Cadastro e assistente**: depois do cadastro, o assistente cria a loja e transforma essa pessoa no dono dela, com acesso apenas à própria loja.
5. **Loja pública por link**: `/loja/<nome>` mostra o nome, o logo, as cores, o cardápio, os horários e a taxa daquela loja. O checkout, o acompanhamento de pedido e as indicações passam a funcionar por loja.
6. **Painel do dono**: o painel atual passa a mostrar só os dados da loja de quem entrou, incluindo o envio de fotos dos produtos e do logo.
7. **Painel de vocês (super admin)**: lista de lojas criadas, mensagens de contato e opção de desativar uma loja.
8. **Verificação**: criar uma loja de teste com outra conta, fazer um pedido nela e confirmar que nenhuma das duas lojas vê os dados da outra.

## Decisões já tomadas
- Cadastro automático e gratuito, sem cobrança por enquanto.
- O contato é feito por um formulário no site.
- A Brazilian Coffee Academy continua como loja real.
- O banco de dados atual é mantido: nenhuma troca de banco e nenhuma conta removida.

## Detalhes técnicos
- Nova tabela `stores` (slug único, nome, logo_url, cores, whatsapp, owner_id, ativa) e `store_members` (user_id, store_id, papel owner). `store_id` passa a existir em coffee_products, orders, customers, referral_codes, referrals e store_settings, com backfill para a loja da Brazilian Coffee Academy. A chave de store_settings passa de booleano para `store_id`. Tudo é feito de forma aditiva: o que fica sem uso é marcado como obsoleto, nada é apagado.
- Função `is_store_owner(store_id)` (security definer). As regras de acesso de cada tabela passam a usar `is_store_owner` ou `has_role(admin)` (super admin). O público só lê produtos disponíveis e configurações de lojas ativas.
- `create_guest_order`, `is_store_open`, `get_order_by_number` e as funções de indicação passam a receber `_store_id` e validar preços, horário e mínimo daquela loja.
- Rota `/loja/:slug` com contexto `StoreProvider`. As rotas atuais (`/`, `/delivery`, etc.) continuam apontando para a loja padrão, para os links já divulgados não quebrarem.
- Bucket de armazenamento `store-assets` para logos e fotos, com escrita permitida apenas ao dono da loja.
- Tabela `contact_submissions`, com inserção anônima validada por zod no cliente e limites no servidor. A leitura fica restrita ao super admin.
- Testes: isolamento entre lojas (o dono A não lê pedidos da loja B) e o checkout usando o preço da loja certa.
- Tudo isso fica registrado em AGENTS.md como regra de multi-loja.

## Fora deste plano (para depois)
- Domínio próprio para cada café, cobrança ou mensalidade e pagamento online via Stripe.

# Corrigir pedidos no site publicado (erro 400)

## O que foi verificado agora

- Ambiente de teste: a tabela de cafés tem os 4 produtos (`espresso` 8.50, `americano` 8.50, `cappuccino` 9.50, `latte` 9.50), todos disponíveis.
- Ambiente Live (site publicado): a mesma tabela está **vazia** (0 linhas).

Por isso a criação de pedido falha no Live: a função de pedido busca o preço do café no servidor, não encontra o produto e cancela o pedido com erro 400. Nenhuma troca de banco e nenhuma remoção de usuários é necessária.

## Plano

1. Inserir os 4 produtos no banco **Live**, com exatamente os mesmos preços do ambiente de teste.
2. Republicar o app para garantir que o site publicado use o código atual.
3. Validar fazendo um pedido de teste real no site publicado e conferindo que o pedido aparece no banco Live.

## Detalhes técnicos

Ferramentas de dados desta sessão gravam apenas no banco de Teste. A inserção no Live é feita em Cloud → Run SQL com o ambiente **Live** selecionado, com este SQL:

```sql
insert into public.coffee_products (id, name, description, price, available) values
  ('espresso',   'Espresso',   'Café espresso brasileiro encorpado',        8.50, true),
  ('americano',  'Americano',  'Espresso alongado com água quente',         8.50, true),
  ('cappuccino', 'Cappuccino', 'Espresso com leite vaporizado e espuma',    9.50, true),
  ('latte',      'Latte',      'Espresso com bastante leite vaporizado',    9.50, true)
on conflict (id) do update
  set name = excluded.name,
      description = excluded.description,
      price = excluded.price,
      available = excluded.available;
```

Depois: Publish → Update, e teste do fluxo de checkout no domínio publicado.

## Fora do escopo

- Trocar de banco de dados ou migrar contas.
- Alterar a lógica de checkout — a validação de preço no servidor está correta e deve permanecer.

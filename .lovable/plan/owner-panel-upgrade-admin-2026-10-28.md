# Owner panel upgrade (/ADMIN)

Today the panel only shows 4 totals and a list of orders with a status dropdown. Order items never load (the panel shows "admin.noOrderItems") and there is no delivery address.

## 1. Fix what's broken
- Load each order's items (coffee, quantity, price) and the delivery address with instructions.
- Add the missing Portuguese and English text for empty states.

## 2. Organize the panel into tabs
- **Pedidos**: orders, now with the new tools below.
- **Cardápio**: manage the coffee menu.
- **Clientes**: who has ordered.
- **Indicações**: the referral program.

## 3. Pedidos (orders)
- Filter by status (Pendente, Confirmado, Preparando, Saiu para entrega, Entregue, Cancelado) and by date (Hoje, 7 dias, Tudo).
- Search by order number, name, email or phone.
- One-click buttons for the next step, e.g. "Confirmar" then "Preparar" then "Saiu para entrega" then "Entregue", plus "Cancelar" with a confirmation.
- Contact buttons: call, WhatsApp, email, and open the address in Google Maps.
- Print or copy an order slip for the kitchen or the driver.
- New orders appear on their own, with a sound and a notice, and you don't need to reload the page.
- Export orders to a spreadsheet (CSV).

## 4. Cardápio (menu)
- Edit name, description, price and photo link.
- Mark a coffee "Disponível" or "Esgotado" (it then disappears from the shop).
- Add new coffees. Coffees can't be deleted, only hidden, so old orders keep their history.

## 5. Clientes (customers)
- List of customers with number of orders, total spent and date of the last order. Search included.

## 6. Indicações (referrals)
- Codes created, how many friends each one referred, and the discounts and credits given.

## 7. Better totals
- Revenue for today, this week and this month, average order value, and best-selling coffee. Cancelled orders are not counted.

## Technical details
- `useAdmin.fetchOrders`: one select joining `customers`, `addresses` and `order_items(*, coffee_products(name))`. Admin access already exists for all of these.
- Real-time updates on the `orders` table. This needs `orders` added to the realtime publication through a migration, and admin read access already covers it.
- Menu changes use the existing admin rules for adding and updating coffees. Deleting stays blocked.
- Split `AdminPage.tsx` (692 lines) into `src/components/admin/{OrdersTab,MenuTab,CustomersTab,ReferralsTab,StatsCards}.tsx`.
- Keep the `has_role` gate, the `/ADMIN` route, the soft visual style and the 700px tablet layout.
- Does not include payments (Stripe is still blocked by the plan) or delivery driver accounts.

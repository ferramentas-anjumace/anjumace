/* ----------------------------------------------------------------------------
   Tenant único da central
   ----------------------------------------------------------------------------
   A central é single-tenant: existe uma única conta — a Anju Mace. Onde antes
   o código pedia um `clientId`, agora passamos esta constante. O UUID é o mesmo
   da row fixa em public.clients (ver migration 0001) e da chave dos seeds em
   data.ts, garantindo que Supabase (acessos) e mocks (conteúdo/editorial)
   apontem para o mesmo tenant.
---------------------------------------------------------------------------- */

export const ANJU_ID = 'a0000000-0000-4000-8000-000000000c06'
export const ANJU_NAME = 'Anju Mace'

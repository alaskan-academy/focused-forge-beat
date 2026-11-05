-- coffee_require_member é só uma checagem interna das outras funções do Coffee Cats;
-- não precisa ser chamável pela API (apontado pelo Security Advisor do Supabase).
REVOKE EXECUTE ON FUNCTION public.coffee_require_member(UUID) FROM authenticated;

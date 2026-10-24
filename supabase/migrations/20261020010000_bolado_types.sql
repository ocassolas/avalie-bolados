-- Novos tipos de bolado. Fica numa migration própria: valores novos de enum
-- não podem ser usados na mesma transação em que são criados.
alter type public.bolado_type add value if not exists 'cumbaia';
alter type public.bolado_type add value if not exists 'ervas';

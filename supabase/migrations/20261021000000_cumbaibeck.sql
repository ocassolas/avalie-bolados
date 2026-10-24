-- O tipo "cumbaia" passa a se chamar CUMBAIBECK na tela. A chave interna
-- (valor do enum bolado_type e a key da conquista) continua 'cumbaia', para não
-- mexer em bolados e conquistas já registrados. Só o texto exibido muda.
update public.badges
  set name = 'Mestre do Cumbaibeck',
      description = '5 cumbaibecks (ervas) com nota final 8,5 ou mais.'
  where key = 'mestre_cumbaia';

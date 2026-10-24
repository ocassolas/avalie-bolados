-- Catálogo: critérios do checklist, conquistas e itens da loja

insert into public.criteria (key, phase, label, description, weight, optional, sort, checklist) values
('bolar', 'pre', 'Bolar', 'Avaliação durante o bolamento: técnica, cuidado e capricho na hora de bolar.', 0.5, true, 1,
 '["Preparou o material com cuidado", "Sem desperdício", "Técnica firme e confiante", "Tempo de bolamento razoável", "Deixou tudo limpo no final"]'),
('estetica', 'pre', 'Estética', 'Aparência do bolado antes de acender: formato, acabamento e capricho visual.', 1.0, false, 2,
 '["Formato uniforme", "Papel liso, sem rasgos ou rugas", "Ponta bem fechada", "Piteira alinhada e centralizada", "Colagem limpa, sem excesso"]'),
('construcao', 'pre', 'Construção', 'O construto: firmeza, distribuição do material e encaixe da piteira.', 1.5, false, 3,
 '["Firmeza certa: nem mole, nem socado", "Material bem distribuído", "Sem pontos ocos", "Piteira bem encaixada", "Proporção piteira e corpo equilibrada"]'),
('crema', 'pos', 'Crema', 'Consistência da crema e fluxo de ar depois de acender.', 1.5, false, 4,
 '["Queima uniforme, sem canoa", "Cinza firme", "Não apagou sozinho", "Puxada no ponto", "Não esquentou demais"]'),
('sabor', 'pos', 'Sabor', 'Gosto pessoal do avaliador.', 1.0, false, 5,
 '["Sabor agradável", "Sem gosto de papel queimado", "Fumaça suave", "Aroma marcante"]'),
('experiencia', 'pos', 'Experiência', 'Como foi para o avaliador o momento que o candidato proporcionou.', 1.0, false, 6,
 '["Momento agradável", "Boa resenha e boa vibe", "Duração adequada", "Fumaria outro desse"]');

insert into public.badges (key, name, description, icon, rarity, reward_brasas, sort) values
('primeiro_cone',   'Primeiro Cone',   'Registrou o primeiro bolado.',                          'cone',     'comum',    20,  1),
('fundador',        'Fundador',        'Criou uma roda.',                                       'users',    'comum',    20,  2),
('nota_10',         'Nota 10',         'Recebeu uma nota 10 de um avaliador.',                  'star',     'epica',    100, 3),
('avaliador_justo', 'Avaliador Justo', 'Fez 10 avaliações.',                                    'scale',    'rara',     50,  4),
('critico_gourmet', 'Crítico Gourmet', 'Fez 50 avaliações.',                                    'chef',     'epica',    150, 5),
('sequencia_7',     'Chama Acesa',     'Usou o app 7 dias seguidos.',                           'flame',    'rara',     70,  6),
('mestre_tabaco',   'Mestre do Tabaco','5 bolados de tabaco com nota final 8,5 ou mais.',      'leaf',     'epica',    150, 7),
('mestre_beck',     'Mestre do Beck',  '5 becks com nota final 8,5 ou mais.',                   'sprout',   'epica',    150, 8),
('fotografo',       'Fotógrafo',       'Enviou 10 fotos de bolados.',                           'camera',   'rara',     50,  9),
('cineasta',        'Cineasta',        'Enviou 3 vídeos.',                                      'video',    'rara',     50,  10),
('veterano',        'Veterano',        'Chegou ao nível 10.',                                   'crown',    'lendaria', 300, 11);

insert into public.shop_items (key, kind, name, description, price, min_level, data, sort) values
-- Temas
('theme_ouro',      'theme', 'Ouro Noturno', 'O clássico: preto profundo e ouro.',            0,   1,  '{"value": "ouro", "swatch": ["#0A0A0A", "#E0A63A"]}', 1),
('theme_neblina',   'theme', 'Neblina',      'Tema claro, cor de fumaça.',                    100, 1,  '{"value": "neblina", "swatch": ["#F2EFEA", "#9A6A1E"]}', 2),
('theme_esmeralda', 'theme', 'Esmeralda',    'Verde profundo com detalhes dourados.',         150, 2,  '{"value": "esmeralda", "swatch": ["#07120D", "#3DDC97"]}', 3),
('theme_brasa',     'theme', 'Brasa',        'Laranja de ponta acesa.',                       200, 3,  '{"value": "brasa", "swatch": ["#120806", "#FF7A3D"]}', 4),
('theme_tabacaria', 'theme', 'Tabacaria',    'Couro, madeira e papel creme.',                 250, 4,  '{"value": "tabacaria", "swatch": ["#17110C", "#C99A6B"]}', 5),
('theme_neon',      'theme', 'Neon 420',     'Roxo e verde elétrico.',                        300, 5,  '{"value": "neon", "swatch": ["#0B0614", "#B6FF3B"]}', 6),
('theme_diamante',  'theme', 'Diamante',     'Para quem chegou lá: azul gelo e prata.',       800, 10, '{"value": "diamante", "swatch": ["#060A10", "#9BE7FF"]}', 7),
-- Molduras de avatar
('frame_ouro',      'frame', 'Aro de Ouro',  'Moldura dourada simples.',                      100, 1,  '{"value": "ouro"}', 10),
('frame_fogo',      'frame', 'Em Chamas',    'Moldura com brasa animada.',                    250, 3,  '{"value": "fogo"}', 11),
('frame_fumaca',    'frame', 'Fumaça',       'Moldura com fumaça girando.',                   300, 5,  '{"value": "fumaca"}', 12),
('frame_coroa',     'frame', 'Coroa',        'Para a realeza da roda.',                       600, 8,  '{"value": "coroa"}', 13),
-- Títulos
('title_artesao',   'title', 'O Artesão',      'Título exibido no seu perfil e no ranking.',  80,  1,  '{"value": "O Artesão"}', 20),
('title_critico',   'title', 'Crítico Gourmet','Título exibido no seu perfil e no ranking.',  150, 2,  '{"value": "Crítico Gourmet"}', 21),
('title_rei',       'title', 'Rei da Seda',    'Título exibido no seu perfil e no ranking.',  200, 4,  '{"value": "Rei da Seda"}', 22),
('title_mao',       'title', 'Mão de Ouro',    'Título exibido no seu perfil e no ranking.',  400, 7,  '{"value": "Mão de Ouro"}', 23),
('title_lenda',     'title', 'Lenda Viva',     'Título exibido no seu perfil e no ranking.',  1000, 12, '{"value": "Lenda Viva"}', 24);

# BRUTAL BLOOD v0.26.0 — Fluid Combat

Jogo de luta 2D em HTML, CSS e JavaScript estáticos para GitHub Pages. Não precisa de backend, Node, Vite ou servidor da aplicação.

## Estrutura
- `index.html` — entrada do jogo
- `css/style.css` — interface
- `js/app.js` — menus e fluxo dos modos
- `js/game/` — motor de luta em ES Modules
- `assets/` — sprites e imagens de runtime
- `sw.js` + `manifest.webmanifest` — PWA/offline no GitHub Pages

## v0.23.0 — carregamento de luta
- sprites carregados com concorrência limitada a 4 workers;
- cache, progresso, fallbacks e cancelamento preservados;
- falha crítica libera referências antes de abortar a luta.

## v0.24.0 — boot e atualização
- motor de combate carregado sob demanda, fora do grafo inicial do menu;
- pre-warm em idle após entrar no menu para esconder o custo da primeira luta;
- Service Worker usa network-first para HTML/JS/CSS e stale-while-revalidate para assets;
- uma nova versão publicada no GitHub Pages substitui o cache antigo automaticamente.

## Publicação
O conteúdo desta pasta pode ficar diretamente na raiz do repositório com **GitHub Pages → Deploy from a branch → main / root**.

Por usar ES Modules, a versão oficial deve ser executada pelo GitHub Pages. Abrir `index.html` via `file://` pode ser bloqueado pelas políticas do navegador.


## v0.25.0 — identidade de combate
- buffer de input e cancels revisados para combos mais consistentes;
- todas as rotas de combo ensinadas pelo jogo auditadas e validadas;
- seis mecânicas exclusivas: Marca do Carrasco, Passo Sombrio, Fúria de Sangue, Altar Rubro, Devorar e Visão Aberta;
- interpolação visual entre ticks de 60 Hz sem alterar hitboxes ou lógica determinística;
- antecipação, impacto, recuperação, afterimages e personalidade de movimento por lutador;
- poderes, comandos e combos assinatura visíveis na seleção e na galeria de personagens.

## v0.26.0 — fluidez de animação
- interpolação visual com easing entre ticks de física, sem alterar hitboxes;
- transição opcional entre quadros de sprite para reduzir mudanças bruscas de pose;
- poses secundárias para dash, salto, defesa, agachamento, caminhada e wakeup;
- afterimages/rastros respeitam o preset gráfico e continuam específicos por lutador;
- presets LOW/MEDIUM/HIGH/ULTRA agora controlam o custo da suavização;
- três opções independentes em Configurações: Movimento suave, Transição entre quadros e Rastros de movimento.

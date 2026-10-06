# BRUTAL BLOOD v0.24.0 — Static GitHub Edition

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

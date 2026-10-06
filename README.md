# BRUTAL BLOOD v0.22.0 — Static GitHub Edition

Distribuição limpa para GitHub Pages.

## Estrutura
- `index.html` — entrada do jogo
- `css/style.css` — toda a interface
- `js/app.js` — interface e fluxo dos modos
- `js/game/` — motor de luta compilado para ES Modules
- `assets/` — sprites e imagens usados em runtime
- `sw.js` + `manifest.webmanifest` — PWA/offline no GitHub Pages

## Publicação
Envie o conteúdo desta pasta para a raiz do repositório e ative **Settings → Pages → Deploy from a branch** apontando para a raiz (`/`). Não há backend, Node, Vite, banco ou servidor da aplicação.

Observação: por usar ES Modules, teste a versão publicada no GitHub Pages. Abrir `index.html` diretamente com `file://` pode ser bloqueado por políticas do navegador.

import { GAME, DIFFICULTY_LABELS, DEFAULT_BINDINGS, ACTION_LABELS, QUALITY_PRESETS } from './game/core/config.js';
import { getSave, patchSave, bumpStat, recordMaxCombo } from './game/core/save.js';
import { playable } from './game/characters/roster.js';
import { Input } from './game/input/Input.js';
import { AudioManager } from './game/audio/AudioManager.js';
import { STAGES } from './game/graphics/stages.js';
import {
  ARCADE_CONTINUES, ARCADE_LADDER, arcadeOpponent, buildBracket, healCarry,
  survivalDifficulty, survivalOpponent, survivalStage
} from './game/modes/runs.js';
import { getStory, hasStory, storyOpponent } from './game/modes/story.js';
import {
  recordArcadeClear, recordStoryClear, recordBloodFinish, recordPerfect,
  progressSnapshot, visibleSlots, hintFor, canSelect
} from './game/progression/index.js';

const root = document.querySelector('#app');

// The combat engine is the heaviest part of the module graph. Keep the menu,
// settings and character browser responsive by loading it only when the player
// is heading into a fight. The promise is shared so menu pre-warming and a
// direct START click never trigger duplicate module downloads.
let fightRuntime = null;
let fightRuntimePromise = null;
function getFightRuntime() {
  if (fightRuntime) return Promise.resolve(fightRuntime);
  if (!fightRuntimePromise) {
    fightRuntimePromise = Promise.all([
      import('./game/Game.js'),
      import('./game/assets/index.js'),
    ]).then(([game, assets]) => {
      fightRuntime = {
        Game: game.Game,
        loadFightAssets: assets.loadFightAssets,
        collectFightJobs: assets.collectFightJobs,
        releaseFightAssets: assets.releaseFightAssets,
      };
      return fightRuntime;
    }).catch(err => {
      fightRuntimePromise = null;
      throw err;
    });
  }
  return fightRuntimePromise;
}
function warmFightRuntime() {
  const warm = () => { getFightRuntime().catch(() => {}); };
  if ('requestIdleCallback' in window) window.requestIdleCallback(warm, { timeout: 1400 });
  else setTimeout(warm, 350);
}
const state = {
  screen: 'boot', mode: 'arcade', p1: null, p2: null, pickSlot: 1,
  difficulty: getSave().difficulty, stageId: getSave().lastStage,
  game: null, pack: null, input: null, audio: null, hud: null,
  results: null, paused: false, loadingAbort: null,
  training: { infiniteHp: true, infiniteMeter: true, showHitboxes: false, showFrameData: true, cpu: 'stand', previewClip: '', frameAdvance: false, forceCounter: false },
  run: { arcadeIndex: 0, continues: ARCADE_CONTINUES, continuesUsed: 0, campaignDifficulty: getSave().difficulty, wave: 1, storyIndex: 0, tourney: null },
};

function h(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (value === true) node.setAttribute(key, '');
    else if (value !== false && value != null) node.setAttribute(key, String(value));
  }
  for (const child of Array.isArray(children) ? children : [children]) {
    if (child == null) continue;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return node;
}

function clearRoot() { root.replaceChildren(); }
function audioMove() { state.audio?.uiMove(); }
function audioConfirm() { state.audio?.uiConfirm(); }
function titleText() { return 'BRUTAL BLOOD'; }
function fighterById(id) { return playable.find(f => f.id === id) || playable[0]; }
function otherFighter(id) { return playable.find(f => f.id !== id) || playable[0]; }

function shell(title, subtitle = '') {
  const wrap = h('main', { class: 'screen shell' });
  wrap.append(h('div', { class: 'ambient ambient-a' }), h('div', { class: 'ambient ambient-b' }));
  const top = h('header', { class: 'topbar' }, [
    h('div', {}, [h('div', { class: 'eyebrow', text: 'BRUTAL BLOOD' }), h('h1', { text: title })]),
    subtitle ? h('div', { class: 'top-sub', text: subtitle }) : null,
  ]);
  wrap.append(top);
  return wrap;
}

function boot() {
  clearRoot();
  const main = h('main', { class: 'screen boot' });
  main.append(
    h('div', { class: 'boot-bg' }),
    h('button', { class: 'boot-hit', onclick: async () => {
      await state.audio?.unlock();
      state.audio?.startMusic();
      audioConfirm();
      menu();
    }}, [
      h('span', { class: 'logo-mark', text: 'BB' }),
      h('span', { class: 'logo', text: titleText() }),
      h('span', { class: 'boot-line', text: 'ENTRAR NA ARENA' }),
      h('span', { class: 'version', text: `v${GAME.VERSION} · STATIC GITHUB EDITION` }),
    ])
  );
  root.append(main);
}

function menu() {
  cleanupFight(false);
  state.screen = 'menu';
  clearRoot();
  const main = shell('BRUTAL BLOOD', 'edição estática · GitHub Pages');
  main.classList.add('menu-screen');
  const hero = h('section', { class: 'menu-hero' }, [
    h('div', { class: 'logo-mark big', text: 'BB' }),
    h('div', { class: 'menu-copy' }, [
      h('div', { class: 'eyebrow', text: 'ARCADE FIGHTING' }),
      h('h2', { class: 'display', text: 'SANGUE. FERRO. SENTENÇA.' }),
      h('p', { text: 'Agora sem backend, sem Vite em runtime e pronto para GitHub Pages.' })
    ])
  ]);
  const grid = h('section', { class: 'menu-grid' });
  const items = [
    ['História', () => openMode('story')], ['Arcade', () => openMode('arcade')],
    ['Versus', () => openMode('versus')], ['Treino', () => openMode('training')],
    ['Survival', () => openMode('survival')], ['Torneio', () => openMode('tournament')],
    ['Personagens', charactersView], ['Progresso', progressView],
    ['Configurações', settingsView], ['Controles', controlsView], ['Créditos', creditsView],
  ];
  for (const [label, fn] of items) grid.append(menuButton(label, fn));
  main.append(hero, grid, h('footer', { class: 'footer-note', text: 'Teclado, gamepad e controles touch suportados.' }));
  root.append(main);
  warmFightRuntime();
}

function menuButton(label, fn) {
  return h('button', { class: 'menu-btn', onclick: () => { audioMove(); fn(); } }, [
    h('span', { class: 'slash', text: '/' }), h('span', { text: label }), h('span', { class: 'arrow', text: '›' })
  ]);
}

function openMode(mode) {
  state.mode = mode;
  state.p1 = null; state.p2 = null; state.pickSlot = 1;
  state.run = { arcadeIndex: 0, continues: ARCADE_CONTINUES, continuesUsed: 0, campaignDifficulty: state.difficulty, wave: 1, storyIndex: 0, tourney: null };
  selectView();
}

function selectView() {
  state.screen = 'select'; clearRoot();
  const modeLabel = ({ arcade:'ARCADE', versus:'VERSUS', training:'TREINO', survival:'SURVIVAL', tournament:'TORNEIO', story:'HISTÓRIA' })[state.mode] || state.mode.toUpperCase();
  const main = shell('SELEÇÃO DE LUTADOR', modeLabel);
  const layout = h('div', { class: 'select-layout' });
  const rosterPanel = h('section', { class: 'panel roster-panel' });
  rosterPanel.append(h('div', { class: 'section-title', text: state.mode === 'versus' ? `ESCOLHA P${state.pickSlot}` : 'ESCOLHA SEU LUTADOR' }));
  const grid = h('div', { class: 'fighter-grid' });
  for (const f of playable) {
    const selected = state.p1?.id === f.id || state.p2?.id === f.id;
    const card = h('button', { class: `fighter-card ${selected ? 'selected' : ''}`, onclick: () => pickFighter(f) }, [
      h('img', { src: f.portrait, alt: f.name }),
      h('div', { class: 'fighter-meta' }, [h('strong', { text: f.name }), h('span', { text: f.title }), h('small', { text: f.style })])
    ]);
    grid.append(card);
  }
  rosterPanel.append(grid);

  const side = h('aside', { class: 'panel select-side' });
  side.append(selectionSummary());
  if (state.p1?.trait) side.append(h('div', { class: 'story-mini trait-mini' }, [
    h('strong', { text: state.p1.trait.name }),
    h('p', { text: state.p1.trait.description })
  ]));
  if (state.p1) side.append(combatGuide(state.p1, true));
  if (state.mode === 'arcade') side.append(selectControl('Dificuldade', Object.entries(DIFFICULTY_LABELS), state.difficulty, v => {
    state.difficulty = v; state.run.campaignDifficulty = v; patchSave({ difficulty: v }); selectView();
  }));
  if (state.mode === 'versus' || state.mode === 'training') side.append(selectControl('Arena', STAGES.map(s => [s.id, s.name]), state.stageId, v => {
    state.stageId = v; patchSave({ lastStage: v }); selectView();
  }));
  if (state.mode === 'survival') {
    side.append(h('div', { class: 'info-strip', text: `Recorde: ${getSave().survivalBest || 0} ondas` }));
  }
  if (state.mode === 'story' && state.p1) {
    const story = getStory(state.p1.id);
    side.append(h('div', { class: 'story-mini' }, [h('strong', { text: story.title }), h('p', { text: story.blurb })]));
  }
  const ready = !!state.p1 && (state.mode !== 'versus' || !!state.p2);
  side.append(h('div', { class: 'select-actions' }, [
    h('button', { class: 'btn ghost', onclick: menu, text: 'VOLTAR' }),
    h('button', { class: 'btn primary', disabled: !ready, onclick: () => {
      audioConfirm();
      if (state.mode === 'story') storyIntro(); else startFight();
    }, text: state.mode === 'story' ? 'COMEÇAR HISTÓRIA' : 'LUTAR' })
  ]));
  layout.append(rosterPanel, side); main.append(layout); root.append(main);
}

function pickFighter(f) {
  audioMove();
  if (state.mode === 'story' && !hasStory(f.id)) return;
  if (state.mode === 'versus') {
    if (state.pickSlot === 1) { state.p1 = f; state.pickSlot = 2; }
    else { state.p2 = f; }
  } else {
    state.p1 = f;
    state.p2 = otherFighter(f.id);
    if (state.mode === 'tournament') {
      const bracket = buildBracket(f); state.run.tourney = { round: 'semi', bracket }; state.p2 = bracket.semiOpp;
    }
    if (state.mode === 'story') {
      state.run.storyIndex = 0; const beat = getStory(f.id).beats[0]; state.p2 = storyOpponent(f, beat.opponentId);
    }
  }
  selectView();
}

function moveName(fighter, moveId) {
  return fighter?.moves?.[moveId]?.name || moveId;
}
function combatGuide(fighter, compact = false) {
  if (!fighter) return null;
  const box = h('div', { class: `combat-guide ${compact ? 'compact' : ''}` });
  const specials = Object.values(fighter.moves || {}).filter(m => m.type === 'special' || m.type === 'counter' || m.type === 'super');
  box.append(h('div', { class:'combat-guide-title', text:'PODERES & COMANDOS' }));
  const moveList = h('div', { class:'move-guide-list' });
  for (const move of specials.slice(0, compact ? 4 : 6)) {
    moveList.append(h('div', { class:'move-guide-row' }, [
      h('span', { text: move.name }),
      h('kbd', { text: move.command || move.button || '—' })
    ]));
  }
  box.append(moveList);
  const combos = (fighter.combos || []).filter(c => ['basic','intermediate','advanced','meter','counter','punish'].includes(c.level)).slice(0, compact ? 3 : 5);
  if (combos.length) {
    box.append(h('div', { class:'combat-guide-title combos-title', text:'COMBOS ASSINATURA' }));
    for (const combo of combos) {
      box.append(h('div', { class:'combo-guide-row' }, [
        h('strong', { text: combo.name }),
        h('small', { text: combo.sequence.map(id => moveName(fighter, id)).join('  ›  ') })
      ]));
    }
  }
  return box;
}

function selectionSummary() {
  const box = h('div', { class: 'versus-preview' });
  box.append(fighterMini(state.p1, 'P1'));
  box.append(h('div', { class: 'vs', text: 'VS' }));
  box.append(fighterMini(state.p2, state.mode === 'versus' ? 'P2' : 'CPU'));
  return box;
}
function fighterMini(f, tag) {
  return h('div', { class: 'mini-fighter' }, f ? [
    h('span', { class: 'mini-tag', text: tag }), h('img', { src: f.portrait, alt: f.name }), h('strong', { text: f.name })
  ] : [h('span', { class: 'mini-tag', text: tag }), h('div', { class: 'mini-empty', text: '?' }), h('strong', { text: 'AGUARDANDO' })]);
}
function selectControl(label, pairs, current, onChange) {
  const wrap = h('label', { class: 'field' }, h('span', { text: label }));
  const select = h('select', { onchange: e => onChange(e.target.value) });
  for (const [value, text] of pairs) select.append(h('option', { value, selected: value === current, text }));
  wrap.append(select); return wrap;
}

function storyIntro() {
  if (!state.p1) return;
  const camp = getStory(state.p1.id); const beat = camp.beats[state.run.storyIndex];
  clearRoot(); const main = shell(`${beat.chapter} · ${beat.title}`, camp.title);
  main.append(h('section', { class: 'story-card panel' }, [
    h('img', { src: state.p1.portrait, alt: state.p1.name }),
    h('div', {}, [h('div', { class: 'eyebrow', text: `${state.p1.name} · ${DIFFICULTY_LABELS[beat.difficulty]}` }), h('h2', { text: beat.title }), h('p', { text: beat.intro }),
      h('div', { class: 'select-actions' }, [h('button', { class:'btn ghost', onclick: selectView, text:'VOLTAR' }), h('button', { class:'btn primary', onclick: startFight, text:'ENFRENTAR' })])])
  ])); root.append(main);
}

async function startFight(options = {}) {
  if (!state.p1) return;
  let foe = state.p2 || otherFighter(state.p1.id);
  let diff = state.difficulty, stage = state.stageId, label = '', winsNeeded = 2;
  const idx = options.arcadeIndex ?? state.run.arcadeIndex;
  const wave = options.wave ?? state.run.wave;
  state.run.arcadeIndex = idx; state.run.wave = wave;

  if (state.mode === 'arcade') {
    const fight = ARCADE_LADDER[idx] || ARCADE_LADDER[0]; foe = arcadeOpponent(state.p1, fight, idx);
    diff = state.run.campaignDifficulty; stage = fight.stageId; label = `${fight.label} · ${idx + 1}/${ARCADE_LADDER.length}`;
  } else if (state.mode === 'survival') {
    foe = survivalOpponent(state.p1, wave); diff = survivalDifficulty(wave); stage = survivalStage(wave); label = `ONDA ${wave}`; winsNeeded = 1;
  } else if (state.mode === 'tournament') {
    const t = state.run.tourney || { round: 'semi', bracket: buildBracket(state.p1) }; state.run.tourney = t;
    foe = t.round === 'final' ? t.bracket.finalOpp : t.bracket.semiOpp; diff = t.round === 'final' ? 'brutal' : 'hard'; stage = t.round === 'final' ? 'fortress' : 'cathedral'; label = t.round === 'final' ? 'FINAL' : 'SEMI';
  } else if (state.mode === 'story') {
    const camp = getStory(state.p1.id); const beat = camp.beats[state.run.storyIndex] || camp.beats[0];
    foe = storyOpponent(state.p1, beat.opponentId); diff = beat.difficulty; stage = beat.stageId; label = `${beat.chapter} · ${state.run.storyIndex + 1}/${camp.beats.length}`;
  }
  state.p2 = foe; state.difficulty = diff; state.stageId = stage;
  patchSave({ difficulty: diff, lastStage: stage });
  state.audio?.stopMusic();
  cleanupFight(false);
  const ac = new AbortController(); state.loadingAbort = ac;
  showLoading(0, 1, 'Inicializando motor de combate…');
  try {
    const runtime = await getFightRuntime();
    if (ac.signal.aborted) return;
    const jobs = runtime.collectFightJobs({ p1: state.p1.id, p2: foe.id, stage });
    showLoading(0, jobs.length || 1, 'Preparando a arena…');
    const pack = await runtime.loadFightAssets({ p1: state.p1.id, p2: foe.id, stage }, {
      signal: ac.signal,
      audioContext: state.audio?.context() ?? null,
      onProgress: p => showLoading(p.loaded, p.total, p.current || 'Carregando…', p.failed?.length || 0),
    });
    if (ac.signal.aborted) { runtime.releaseFightAssets(pack); return; }
    state.pack = pack;
    launchFight({ foe, diff, stage, label, winsNeeded, carry: options.carry, pack, runtime });
  } catch (err) {
    if (ac.signal.aborted) return;
    showLoadingError(err instanceof Error ? err.message : 'Falha ao carregar a luta.');
  }
}

function showLoading(done, total, current, failed = 0) {
  state.screen = 'loading'; clearRoot(); const pct = Math.round((done / Math.max(1,total))*100);
  const main = h('main', { class:'screen loading-screen' }, [h('div', { class:'loading-card panel' }, [
    h('div', { class:'eyebrow', text:'CARREGAMENTO DIRETO' }), h('h1', { text:`${state.p1?.name || ''} VS ${state.p2?.name || ''}` }),
    h('div', { class:'progress' }, h('div', { style:`width:${pct}%` })), h('strong', { text:`${pct}%` }), h('p', { text: current }),
    failed ? h('small', { class:'warn', text:`${failed} asset(s) usaram fallback.` }) : null
  ])]); root.append(main);
}
function showLoadingError(message) {
  clearRoot(); const main = shell('ERRO DE CARREGAMENTO','assets estáticos');
  main.append(h('section',{class:'panel error-card'},[h('p',{text:message}),h('div',{class:'select-actions'},[
    h('button',{class:'btn ghost',onclick:selectView,text:'VOLTAR'}),h('button',{class:'btn primary',onclick:()=>startFight(),text:'TENTAR DE NOVO'})
  ])])); root.append(main);
}

function launchFight({ foe, diff, stage, label, winsNeeded, carry, pack, runtime }) {
  state.screen = 'fight'; clearRoot();
  const arena = h('main', { class:'fight-screen' });
  const canvas = h('canvas', { width:1280, height:720, class:'game-canvas' });
  const hud = buildHud();
  const overlays = h('div',{id:'overlays',class:'overlay-root'});
  arena.append(canvas, hud, overlays);
  root.append(arena);
  createTouchControls(arena);
  const game = new runtime.Game({
    canvas, p1:state.p1, p2:foe, mode:state.mode, difficulty:diff, stageId:stage,
    input:state.input, audio:state.audio, winsNeeded, runLabel:label, carry, assets:pack,
    onHUD:updateHud, onMatchEnd:finishMatch, onPause:v=>{ state.paused=v; renderPause(); }
  });
  if (state.mode === 'training') game.setTraining(state.training);
  state.game = game; game.start(); state.audio?.startMusic();
}

function buildHud() {
  const wrap=h('div',{class:'hud',id:'hud'});
  wrap.innerHTML=`
    <div class="hud-side left"><div class="hud-name" id="p1name">P1</div><div class="hud-status" id="p1status"></div><div class="health"><i id="p1hp"></i></div><div class="meter"><i id="p1meter"></i></div><div class="super"><i id="p1super"></i></div></div>
    <div class="hud-center"><div id="runlabel" class="runlabel"></div><div id="timer" class="timer">99</div><div id="roundlabel" class="roundlabel"></div></div>
    <div class="hud-side right"><div class="hud-name" id="p2name">P2</div><div class="hud-status" id="p2status"></div><div class="health"><i id="p2hp"></i></div><div class="meter"><i id="p2meter"></i></div><div class="super"><i id="p2super"></i></div></div>
    <div id="fightmsg" class="fight-msg"></div><div id="combo" class="combo"></div>`;
  return wrap;
}
function updateHud(hud) {
  state.hud=hud;
  const $=id=>document.getElementById(id); if (!$('p1hp')) return;
  $('p1name').textContent=hud.p1.name; $('p2name').textContent=hud.p2.name;
  $('p1status').textContent=(hud.p1.statuses||[]).join(' · '); $('p2status').textContent=(hud.p2.statuses||[]).join(' · ');
  $('p1hp').style.width=`${Math.max(0,hud.p1.health/hud.p1.maxHealth*100)}%`; $('p2hp').style.width=`${Math.max(0,hud.p2.health/hud.p2.maxHealth*100)}%`;
  $('p1meter').style.width=`${hud.p1.meter}%`; $('p2meter').style.width=`${hud.p2.meter}%`;
  $('p1super').style.width=`${hud.p1.superMeter}%`; $('p2super').style.width=`${hud.p2.superMeter}%`;
  $('timer').textContent=String(Math.ceil(hud.timer)); $('roundlabel').textContent=hud.roundLabel || `ROUND ${hud.round}`; $('runlabel').textContent=hud.runLabel || '';
  $('fightmsg').textContent=hud.message || (hud.finish ? hud.finishHint : '');
  $('combo').textContent=hud.combo ? `${hud.combo.hits} HITS · ${Math.round(hud.combo.damage)} DMG` : '';
}

function renderPause() {
  const overlay=document.querySelector('#overlays'); if (!overlay) return;
  overlay.querySelector('.pause-layer')?.remove(); if (!state.paused) return;
  const layer=h('div',{class:'modal-layer pause-layer'},h('div',{class:'modal panel'},[
    h('div',{class:'eyebrow',text:'PAUSADO'}),h('h2',{text:'A ARENA ESPERA'}),
    h('button',{class:'btn primary',onclick:()=>state.game?.match.togglePause(false),text:'CONTINUAR'}),
    h('button',{class:'btn',onclick:()=>{state.game?.match.restartRound();state.game?.match.togglePause(false);},text:'REINICIAR ROUND'}),
    h('button',{class:'btn ghost',onclick:()=>{cleanupFight(false);selectView();},text:'SELEÇÃO'}),h('button',{class:'btn ghost',onclick:menu,text:'MENU'})
  ])); overlay.append(layer);
}

function createTouchControls(arena) {
  if (!matchMedia('(pointer: coarse)').matches) return;
  const tc=h('div',{class:'touch-controls'}); const left=h('div',{class:'touch-dpad'}); const right=h('div',{class:'touch-actions'});
  const add=(parent, action,label)=>{ const b=h('button',{class:'touch-btn',text:label}); const down=e=>{e.preventDefault();b.setPointerCapture?.(e.pointerId);state.input.setVirtual(action,true)}; const up=e=>{e.preventDefault();state.input.setVirtual(action,false)}; b.addEventListener('pointerdown',down);b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);parent.append(b); };
  add(left,'left','◀');add(left,'up','▲');add(left,'down','▼');add(left,'right','▶');
  [['light','LP'],['medium','MP'],['heavy','HP'],['kickLight','LK'],['kickHeavy','HK'],['special','SP'],['block','BL'],['super','SU'],['throw','TH']].forEach(([a,l])=>add(right,a,l));
  tc.append(left,right); arena.append(tc);
}

function finishMatch(won) {
  const match=state.game?.match; if (!match || !state.p1) return menu();
  bumpStat(state.p1.id, won?'wins':'losses'); if (state.p2) bumpStat(state.p2.id, won?'losses':'wins');
  recordMaxCombo(state.p1.id, match.p1.maxCombo || 0);
  if (match.bloodFinishDone && match.finisher===match.p1) recordBloodFinish(state.p1.id);
  for(let i=0;i<(match.perfectCount||0);i++) recordPerfect(state.p1.id);
  const snap={health:match.p1.health,meter:match.p1.meter,superMeter:match.p1.superMeter};
  let r={won,title:won?'VITÓRIA':'DERROTA',subtitle:won?'Mais um nome na lista.':'A sentença foi executada.',next:null,...snap};
  if(state.mode==='arcade'){
    const idx=state.run.arcadeIndex;
    if(won && idx>=ARCADE_LADDER.length-1){recordArcadeClear(state.p1.id,{difficulty:state.run.campaignDifficulty,noContinue:state.run.continuesUsed===0});r={...r,title:'ARCADE CLEAR',subtitle:'O chefe caiu. O sangue é seu.',next:null};}
    else if(won){r={...r,title:'VITÓRIA',subtitle:`Próximo: ${ARCADE_LADDER[idx+1].label}`,next:'arcade'};}
    else if(state.run.continues>0){r={...r,title:'DERROTA',subtitle:`Continues: ${state.run.continues}`,next:'continue'};}
    else r={...r,title:'FIM DE JOGO',subtitle:'A arena cobra o saldo.',next:null};
  } else if(state.mode==='survival'){
    const w=state.run.wave;
    if(won){ if(w>(getSave().survivalBest||0)) patchSave({survivalBest:w}); r={...r,title:`ONDA ${w}`,subtitle:'A próxima onda já vem.',next:'survival'}; }
    else r={...r,title:'FIM DE JOGO',subtitle:`Ondas sobrevividas: ${Math.max(0,w-1)}`,next:null};
  } else if(state.mode==='tournament'){
    const t=state.run.tourney;
    if(won && t?.round==='semi') r={...r,title:'SEMI',subtitle:`Final contra ${t.bracket.finalOpp.name}`,next:'tournament'};
    else if(won){patchSave({tournamentWon:true});r={...r,title:'CAMPEÃO',subtitle:'O torneio é seu.',next:null};}
    else r={...r,title:'ELIMINADO',subtitle:'A chave não perdoa.',next:null};
  } else if(state.mode==='story'){
    const camp=getStory(state.p1.id), i=state.run.storyIndex, beat=camp.beats[i];
    if(won && i<camp.beats.length-1) r={...r,title:beat.title,subtitle:beat.winLine,next:'story'};
    else if(won){recordStoryClear(state.p1.id);r={...r,title:camp.title,subtitle:camp.ending,next:null};}
    else r={...r,title:'FIM',subtitle:'A história acaba aqui.',next:null};
  }
  state.results=r; showResults();
}

function showResults(){
  const overlay=document.querySelector('#overlays'); if(!overlay||!state.results)return;
  const r=state.results; const layer=h('div',{class:'modal-layer result-layer'},h('div',{class:`modal panel result ${r.won?'win':'lose'}`},[
    h('div',{class:'eyebrow',text:r.won?'RESULTADO':'DERROTA'}),h('h2',{text:r.title}),h('p',{text:r.subtitle}),
    h('div',{class:'result-actions'},[
      r.next?h('button',{class:'btn primary',onclick:advanceRun,text:r.next==='continue'?'CONTINUE':'PRÓXIMO'}):null,
      h('button',{class:'btn ghost',onclick:menu,text:'MENU'})
    ])
  ])); overlay.append(layer);
}
function advanceRun(){
  const r=state.results; state.results=null;
  if(r?.next==='arcade'){state.run.arcadeIndex++;startFight({arcadeIndex:state.run.arcadeIndex});return;}
  if(r?.next==='continue'){state.run.continues--;state.run.continuesUsed++;startFight({arcadeIndex:state.run.arcadeIndex});return;}
  if(r?.next==='survival'){state.run.wave++;startFight({wave:state.run.wave,carry:{health:healCarry(r.health,state.p1.stats.maxHealth),meter:r.meter,superMeter:r.superMeter}});return;}
  if(r?.next==='tournament'){state.run.tourney.round='final';startFight();return;}
  if(r?.next==='story'){state.run.storyIndex++;cleanupFight(false);storyIntro();return;}
  menu();
}

function cleanupFight(startMusic=true){
  state.loadingAbort?.abort(); state.loadingAbort=null;
  state.game?.destroy(); state.game=null;
  if(state.pack){fightRuntime?.releaseFightAssets(state.pack);state.pack=null;}
  state.hud=null;state.paused=false;state.results=null;
  if(startMusic) state.audio?.startMusic();
}

function charactersView(){
  clearRoot(); const main=shell('PERSONAGENS','elenco e desbloqueios'); const grid=h('div',{class:'characters-grid'}); const save=getSave();
  for(const slot of visibleSlots(save)){
    const live=playable.find(f=>f.id===slot.id); const selectable=canSelect(slot.id,save); const card=h('article',{class:`panel char-detail ${selectable?'':'locked'}`},[
      live?h('img',{src:live.portrait,alt:slot.name}):h('div',{class:'unknown-portrait',text:'?'}),
      h('div',{},[h('div',{class:'eyebrow',text:`SLOT ${String(slot.slot).padStart(2,'0')}`}),h('h3',{text:slot.name}),h('strong',{text:slot.title}),h('p',{text:live?.lore||hintFor(slot.id,save)||'Em desenvolvimento.'}),live?.trait?h('p',{class:'char-trait',text:`${live.trait.name} — ${live.trait.description}`}):null,selectable&&live?combatGuide(live,true):null,h('small',{text:selectable?'JOGÁVEL':hintFor(slot.id,save)})])
    ]); grid.append(card);
  }
  main.append(grid,backButton(menu));root.append(main);
}
function progressView(){
  clearRoot();const main=shell('PROGRESSO','save local');const p=progressSnapshot(),s=getSave();
  main.append(h('section',{class:'panel progress-card'},[
    h('div',{class:'progress-big',text:`${p.percent}%`}),h('div',{class:'progress',html:`<div style="width:${p.percent}%"></div>`}),
    statGrid([['Lutadores',`${p.unlocked}/${p.total}`],['Arcades',p.arcadeClears],['Blood Finishes',p.bloodFinishes],['Secretas',p.secretWins],['Survival',s.survivalBest||0],['Vitórias',Object.values(s.stats||{}).reduce((a,x)=>a+(x.wins||0),0)]])
  ]),backButton(menu));root.append(main);
}
function statGrid(items){const g=h('div',{class:'stat-grid'});for(const [k,v] of items)g.append(h('div',{class:'stat'},[h('span',{text:k}),h('strong',{text:String(v)})]));return g;}

function settingsView(){
  clearRoot();const main=shell('CONFIGURAÇÕES','salvas no navegador');const save=getSave();const panel=h('section',{class:'panel settings-card'});
  const preset=selectControl('Qualidade',Object.keys(QUALITY_PRESETS).map(x=>[x,x.toUpperCase()]),save.graphics.preset,v=>{const next={...save.graphics,...QUALITY_PRESETS[v],preset:v};patchSave({graphics:next});settingsView();});panel.append(preset);
  for(const [key,label] of [['master','Volume geral'],['music','Música'],['sfx','Efeitos']]){
    const row=h('label',{class:'range-field'},[h('span',{text:label})]);const input=h('input',{type:'range',min:0,max:1,step:0.05,value:save.audio[key],oninput:e=>{const a={...getSave().audio,[key]:Number(e.target.value)};patchSave({audio:a});state.audio.apply(a);}});row.append(input);panel.append(row);
  }
  for(const [key,label] of [['particles','Partículas'],['screenShake','Screen shake'],['hitstop','Hitstop'],['bloom','Bloom'],['stageFx','Efeitos do cenário'],['motionSmoothing','Movimento suave'],['frameBlend','Transição entre quadros'],['motionTrails','Rastros de movimento']]) panel.append(toggle(label,save.graphics[key],v=>{patchSave({graphics:{...getSave().graphics,[key]:v}});settingsView();}));
  panel.append(toggle('Vibração',save.rumble,v=>{patchSave({rumble:v});state.input.rumble=v;settingsView();}));
  main.append(panel,backButton(menu));root.append(main);
}
function toggle(label,value,onChange){const row=h('label',{class:'toggle-row'},[h('span',{text:label})]);const input=h('input',{type:'checkbox',checked:value,onchange:e=>onChange(e.target.checked)});row.append(input);return row;}

function controlsView(){
  clearRoot();const main=shell('CONTROLES','clique para remapear');const wrap=h('section',{class:'controls-wrap'});const bindings=getSave().bindings;
  for(const slot of ['p1','p2']){
    const panel=h('div',{class:'panel control-panel'},[h('div',{class:'section-title',text:slot.toUpperCase()})]);
    for(const [action,label] of Object.entries(ACTION_LABELS)){
      const code=(bindings[slot][action]||[])[0]||'—';panel.append(h('button',{class:'binding-row',onclick:()=>beginRemap(slot,action)},[h('span',{text:label}),h('kbd',{text:code})]));
    } wrap.append(panel);
  }
  main.append(wrap,h('div',{class:'select-actions center'},[h('button',{class:'btn',onclick:()=>{const b=structuredClone(DEFAULT_BINDINGS);state.input.bindings=structuredClone(b);patchSave({bindings:b});controlsView();},text:'RESTAURAR PADRÃO'}),h('button',{class:'btn ghost',onclick:menu,text:'VOLTAR'})]));root.append(main);
}
function beginRemap(slot,action){
  const overlay=h('div',{class:'modal-layer remap-layer'},h('div',{class:'modal panel'},[h('div',{class:'eyebrow',text:'REMAPPANDO'}),h('h2',{text:ACTION_LABELS[action]}),h('p',{text:'Pressione uma tecla…'}),h('button',{class:'btn ghost',text:'CANCELAR',onclick:()=>{state.input.cancelRemap();overlay.remove();}})]));root.append(overlay);
  state.input.onRemap=code=>{patchSave({bindings:structuredClone(state.input.bindings)});overlay.remove();controlsView();};state.input.beginRemap(slot,action);
}
function creditsView(){clearRoot();const main=shell('CRÉDITOS','BRUTAL BLOOD');main.append(h('section',{class:'panel text-card'},[h('h2',{text:`Versão ${GAME.VERSION}`}),h('p',{text:'Motor de luta 2D em Canvas. Esta edição foi reorganizada para HTML, CSS e JavaScript estáticos, sem backend e pronta para GitHub Pages.'}),h('p',{text:'Os sprites e sistemas do projeto foram preservados; a camada de servidor e ferramentas de desenvolvimento foi removida da distribuição.'})]),backButton(menu));root.append(main);}
function backButton(fn){return h('div',{class:'back-wrap'},h('button',{class:'btn ghost',onclick:()=>{audioMove();fn();},text:'← VOLTAR'}));}

function init(){
  const save=getSave();state.input=new Input(structuredClone(save.bindings));state.input.rumble=save.rumble;state.input.attach();state.audio=new AudioManager(save.audio);
  document.addEventListener('visibilitychange',()=>{state.audio.setFocus(!document.hidden);if(!document.hidden)state.audio.resume();});
  window.addEventListener('beforeunload',()=>cleanupFight(false));
  boot();
}
init();

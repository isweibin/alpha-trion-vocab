(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=[4,6,8,10,12];function t(t){return e.includes(t)}function n(e){return e.trim().replace(/\s+/g,` `).toLocaleLowerCase(`en-US`)}var r=`alpha-trion-vocab:data`,i=`alpha-trion-vocab:words-per-game`;function a(){return{version:1,units:[],words:[],progress:[],sessions:[]}}function o(){let e;try{e=localStorage.getItem(r)}catch(e){throw Error(`Local storage is unavailable.`,{cause:e})}return e?p(JSON.parse(e)):a()}function s(e){let t=p(e);try{localStorage.setItem(r,JSON.stringify(t))}catch(e){throw Error(`Failed to save local data.`,{cause:e})}}function c(){try{localStorage.removeItem(r)}catch(e){throw Error(`Failed to clear local data.`,{cause:e})}}function l(){try{let e=Number(localStorage.getItem(i));return t(e)?e:8}catch{return 8}}function u(e){if(t(e))try{localStorage.setItem(i,String(e))}catch{}}function d(e){let t=JSON.stringify(p(e),null,2),n=new Blob([t],{type:`application/json`}),r=URL.createObjectURL(n),i=document.createElement(`a`),a=new Date().toISOString().slice(0,10);i.href=r,i.download=`alpha-trion-vocab-${a}.json`,document.body.append(i),i.click(),i.remove(),window.setTimeout(()=>URL.revokeObjectURL(r),0)}function f(e){return p(JSON.parse(e))}function p(e){if(!m(e)||e.version!==1)throw Error(`Unsupported data version.`);if(!Array.isArray(e.units)||!Array.isArray(e.words)||!Array.isArray(e.progress)||!Array.isArray(e.sessions))throw Error(`Invalid data structure.`);if(!e.units.every(ee))throw Error(`Invalid unit data.`);if(!e.words.every(te))throw Error(`Invalid word data.`);if(!e.progress.every(ne))throw Error(`Invalid progress data.`);if(!e.sessions.every(re))throw Error(`Invalid session data.`);let t=e.units,r=e.words,i=e.progress,a=e.sessions;v(t.map(e=>e.id),`Duplicate unit ID.`),v(r.map(e=>e.id),`Duplicate word ID.`),v(r.map(e=>`${e.unitId}\0${n(e.term)}`),`Duplicate word term in unit.`),v(i.map(e=>e.wordId),`Duplicate progress record.`);let o=new Set(t.map(e=>e.id));if(r.some(e=>!o.has(e.unitId)))throw Error(`Word references a missing unit.`);let s=new Set(r.map(e=>e.id));if(i.some(e=>!s.has(e.wordId)))throw Error(`Progress references a missing word.`);return{version:1,units:t,words:r,progress:i,sessions:a}}function ee(e){return m(e)&&h(e.id)&&h(e.name)&&g(e.createdAt)}function te(e){return m(e)&&h(e.id)&&h(e.unitId)&&h(e.term)&&h(e.meaning)}function ne(e){return m(e)&&h(e.wordId)&&typeof e.level==`number`&&Number.isInteger(e.level)&&e.level>=0&&e.level<=7&&(e.nextReviewAt===null||g(e.nextReviewAt))&&_(e.correct)&&_(e.wrong)}function re(e){return m(e)&&g(e.date)&&_(e.words)&&_(e.correct)&&_(e.wrong)}function m(e){return typeof e==`object`&&!!e}function h(e){return typeof e==`string`&&e.trim().length>0}function ie(e){return typeof e==`number`&&Number.isFinite(e)}function g(e){return ie(e)&&e>=0}function _(e){return typeof e==`number`&&Number.isInteger(e)&&e>=0}function v(e,t){if(new Set(e).size!==e.length)throw Error(t)}function y(e){let t=[...e];for(let e=t.length-1;e>0;--e){let n=Math.floor(Math.random()*(e+1));[t[e],t[n]]=[t[n],t[e]]}return t}function ae(e,t=8){let n=y(e).slice(0,t);return{words:n,cards:y(n.flatMap(e=>[{id:`${e.id}:term`,wordId:e.id,kind:`term`,text:e.term,matched:!1},{id:`${e.id}:meaning`,wordId:e.id,kind:`meaning`,text:e.meaning,matched:!1}])),selectedCardId:null,locked:!1,correct:0,wrong:0,wordStates:n.map(e=>({wordId:e.id,hadError:!1}))}}function b(e,t){let n=e.wordStates.find(e=>e.wordId===t);n&&(n.hadError=!0)}function x(e){return e.cards.every(e=>e.matched)}function oe(){if(typeof crypto.randomUUID==`function`)return crypto.randomUUID();let e=new Uint8Array(16);crypto.getRandomValues(e),e[6]=e[6]&15|64,e[8]=e[8]&63|128;let t=Array.from(e,e=>e.toString(16).padStart(2,`0`)).join(``);return[t.slice(0,8),t.slice(8,12),t.slice(12,16),t.slice(16,20),t.slice(20)].join(`-`)}function se(e){return e.map(e=>`${e.term}\t${e.meaning}`).join(`
`)}function ce(e){let t=[],r=[],i=new Map;return e.split(/\r?\n/).forEach((e,a)=>{let o=a+1;if(!e.trim())return;let s=e.split(`	`);if(s.length!==2){r.push({line:o,message:`应为两列「英文<TAB>中文」。`});return}let[c,l]=s,u=c.trim(),d=l.trim();if(!u||!d){r.push({line:o,message:`英文和中文都不能为空。`});return}let f=n(u),p=i.get(f);if(p!==void 0){r.push({line:o,message:`英文重复，首次出现在第 ${p} 行。`});return}i.set(f,o),t.push({term:u,meaning:d})}),t.length===0&&r.length===0&&r.push({line:0,message:`没有识别到可导入的单词。`}),{words:t,errors:r}}function le(e,t,r){let i=e.words.filter(e=>e.unitId===t),a=new Map(i.map(e=>[n(e.term),e])),o=new Set(r.map(e=>n(e.term))),s=[],c=[],l=[];for(let e of r){let t=a.get(n(e.term));if(!t){s.push(e);continue}t.term!==e.term||t.meaning!==e.meaning?c.push({before:t,after:e}):l.push(t)}return{added:s,updated:c,removed:i.filter(e=>!o.has(n(e.term))),unchanged:l,incoming:r}}function ue(e,t,r){let i=e.words.filter(e=>e.unitId===t),a=new Map(i.map(e=>[n(e.term),e])),o=new Set,s=r.incoming.map(e=>{let r=a.get(n(e.term));return r?(o.add(r.id),{...r,term:e.term,meaning:e.meaning}):{id:oe(),unitId:t,term:e.term,meaning:e.meaning}}),c=new Set(i.map(e=>e.id));return{...e,words:[...e.words.filter(e=>e.unitId!==t),...s],progress:e.progress.filter(e=>!c.has(e.wordId)||o.has(e.wordId))}}var de=[6e5,864e5,2592e5,6048e5,12096e5,2592e6];function fe(e){let t=new Set(e.progress.map(e=>e.wordId));return e.words.filter(e=>!t.has(e.id))}function S(e,t=Date.now()){let n=new Map(e.progress.filter(e=>e.level<7&&e.nextReviewAt!==null&&e.nextReviewAt<=t).map(e=>[e.wordId,e.nextReviewAt]));return e.words.filter(e=>n.has(e.id)).sort((e,t)=>(n.get(e.id)??0)-(n.get(t.id)??0))}function pe(e){return e.progress.filter(e=>e.level>=7).length}function C(e,t){let n=S(e).slice(0,t);if(n.length>=t)return n;let r=new Set(n.map(e=>e.id)),i=y(fe(e)).filter(e=>!r.has(e.id));return[...n,...i.slice(0,t-n.length)]}function me(e,t,n,r=Date.now()){let i=e.progress.find(e=>e.wordId===t)??{wordId:t,level:0,nextReviewAt:null,correct:0,wrong:0},a;if(n)a={...i,level:Math.max(i.level-1,0),nextReviewAt:r+de[0],wrong:i.wrong+1};else{let e=Math.min(i.level+1,7);a={...i,level:e,nextReviewAt:e>=7?null:r+de[Math.max(e-1,0)],correct:i.correct+1}}return{...e,progress:[...e.progress.filter(e=>e.wordId!==t),a]}}function he(e,t,n,r=Date.now()){let i=e;if(n===`daily`)for(let e of t.wordStates)i=me(i,e.wordId,e.hadError,r);let a={date:r,words:t.words.length,correct:t.correct,wrong:t.wrong};return{...i,sessions:[...i.sessions,a]}}function w(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#039;`)}function T(e){return w(e)}async function ge(e,t,n=``,r=``){let i=O(`
    <form method="dialog" class="dialog-body">
      <h2>${w(e)}</h2>
      <div class="field">
        <label for="dialog-input">${w(t)}</label>
        <input class="input" id="dialog-input" value="${T(r)}" placeholder="${T(n)}" autocomplete="off">
      </div>
      <div class="dialog-actions">
        <button class="btn" value="cancel">取消</button>
        <button class="btn primary" value="confirm">确定</button>
      </div>
    </form>
  `),a=i.querySelector(`#dialog-input`);return i.showModal(),a?.focus(),a?.select(),await k(i)===`confirm`&&a?.value.trim()||null}async function _e(e){let t=O(`
    <form method="dialog" class="dialog-body">
      <h2>编辑单词</h2>
      <div class="field">
        <label for="word-term">英文</label>
        <input class="input" id="word-term" value="${T(e.term)}" autocomplete="off">
      </div>
      <div class="field">
        <label for="word-meaning">中文</label>
        <input class="input" id="word-meaning" value="${T(e.meaning)}" autocomplete="off">
      </div>
      <div class="dialog-actions">
        <button class="btn" value="cancel">取消</button>
        <button class="btn primary" value="confirm">保存</button>
      </div>
    </form>
  `),n=t.querySelector(`#word-term`);if(t.showModal(),n?.focus(),n?.select(),await k(t)!==`confirm`)return null;let r=n?.value.trim()??``,i=t.querySelector(`#word-meaning`)?.value.trim()??``;return!r||!i?null:{term:r,meaning:i}}async function E(e,t,n,r=!1){let i=O(`
    <form method="dialog" class="dialog-body">
      <h2>${w(e)}</h2>
      <p class="dialog-message">${w(t)}</p>
      <div class="dialog-actions">
        <button class="btn" value="cancel">取消</button>
        <button class="btn ${r?`danger`:`primary`}" value="confirm">${w(n)}</button>
      </div>
    </form>
  `);return i.showModal(),await k(i)===`confirm`}async function D(e,t){let n=O(`
    <form method="dialog" class="dialog-body">
      <h2>${w(e)}</h2>
      <p class="dialog-message">${w(t)}</p>
      <div class="dialog-actions">
        <button class="btn primary" value="confirm">知道了</button>
      </div>
    </form>
  `);n.showModal(),await k(n)}function O(e){let t=document.createElement(`dialog`);return t.className=`dialog`,t.innerHTML=e,document.body.append(t),t}function k(e){return new Promise(t=>{e.addEventListener(`close`,()=>{let n=e.returnValue;e.remove(),t(n)},{once:!0})})}function ve(e){return`
    <div class="app-shell">
      <header class="topbar">
        <div class="brand">Alpha Trion <small>Vocab</small></div>
      </header>
      ${Ce(e.route)}
      <main class="content">${Te(e)}</main>
    </div>
  `}function ye(){return`
    <div class="fatal-shell">
      <section class="card fatal-card">
        <div class="hint">Alpha Trion Vocab</div>
        <h1>本地数据无法读取</h1>
        <p>浏览器中现有数据可能已损坏，程序没有自动把它当成空词库。可以恢复之前导出的 JSON 备份，或者确认后清空本地数据重新开始。</p>
        <div class="button-row actions-spaced">
          <button class="btn primary" id="fatal-restore">恢复备份</button>
          <button class="btn danger" id="fatal-reset">清空本地数据</button>
          <input type="file" id="fatal-file" accept="application/json,.json" hidden>
        </div>
      </section>
    </div>
  `}function be(e){return e.length?`
    <ul class="error-list">
      ${e.map(e=>`<li>${e.line?`第 ${e.line} 行：`:``}${w(e.message)}</li>`).join(``)}
    </ul>
  `:``}function xe(e){if(!e)return``;let{added:t,updated:n,removed:r,unchanged:i}=e,a=t.length+n.length+r.length,o=r.length?`danger`:`primary`;return`
    <div class="diff-section">
      <h3>同步预览</h3>
      <div class="stat-list">
        <div class="stat-row"><strong>新增</strong><span>${t.length}</span></div>
        <div class="stat-row"><strong>修改</strong><span>${n.length}</span></div>
        <div class="stat-row"><strong>删除</strong><span>${r.length}</span></div>
        <div class="stat-row"><strong>保持</strong><span>${i.length}</span></div>
      </div>

      ${j(`新增`,t.map(e=>`+ ${e.term}　${e.meaning}`),`added`)}
      ${j(`修改`,n.map(e=>`~ ${e.before.term}　${e.before.meaning} → ${e.after.term}　${e.after.meaning}`),``)}
      ${j(`删除`,r.map(e=>`- ${e.term}　${e.meaning}`),`removed`)}

      <div class="button-row diff-actions">
        <button class="btn ${o}" id="apply-import">
          ${a?r.length?`更新单元 · 删除 ${r.length}`:`更新单元`:`确认无变化`}
        </button>
      </div>
    </div>
  `}function Se(e,t,n){if(e.cards.every(e=>e.matched)){let r=n===`daily`?`再练一遍`:`再来一局`;return`
      <div class="game-shell">
        <div class="game-result">
          <section class="card">
            <div class="hint">${w(t)}</div>
            <div class="result-number">完成</div>
            <p>${e.words.length} 个单词 · 错误尝试 ${e.wrong} 次</p>
            ${n===`daily`?`<p class="result-note">今日学习已经结算；再练一遍只作为自由练习，不会再次推进复习进度。</p>`:``}
            <div class="button-row centered result-actions">
              <button class="btn primary" id="game-again">${r}</button>
              <button class="btn" id="game-home">返回学习</button>
            </div>
          </section>
        </div>
      </div>
    `}let r=e.cards.filter(e=>e.matched).length/2;return`
    <div class="game-shell">
      <header class="game-head">
        <button class="btn ghost" id="quit-game">← 退出</button>
        <div>
          <strong>${w(t)}</strong>
          <span class="progress-text">${r}/${e.words.length}</span>
        </div>
      </header>
      <main class="game-board">
        ${e.cards.map(t=>Ne(e,t)).join(``)}
      </main>
    </div>
  `}function Ce(e){let t=we(e);return`
    <nav class="bottom-nav" aria-label="主导航">
      ${A(`study`,`学习`,t)}
      ${A(`words`,`单词`,t)}
      ${A(`stats`,`统计`,t)}
    </nav>
  `}function we(e){return e.page===`unit`||e.page===`import`?`words`:e.page===`preview`||e.page===`game`?`study`:e.page}function A(e,t,n){return`<button class="nav-btn ${n===e?`active`:``}" data-nav="${e}">${t}</button>`}function Te(e){switch(e.route.page){case`study`:return Ee(e.data,e.wordsPerGame);case`words`:return Oe(e.data);case`stats`:return Me(e.data);case`unit`:return ke(e.data,e.route.unitId);case`import`:return Ae(e.data,e.route.unitId,e.importText,e.importDiff);case`preview`:return je(e.data,e.pendingGame);case`game`:return``}}function Ee(e,t){let n=C(e,t),r=new Set(S(e).map(e=>e.id)),i=n.filter(e=>r.has(e.id)).length,a=n.length-i,o=n.length>0,s=[...e.units].sort((e,t)=>e.createdAt-t.createdAt).map(e=>`<option value="${T(e.id)}">${w(e.name)}</option>`).join(``);return`
    <section class="page-head">
      <div>
        <h1>今天</h1>
        <p>先处理最早到期的单词，再补充新词。</p>
      </div>
    </section>

    <section class="card hero">
      <div class="daily-plan">
        <strong>${n.length}</strong>
        <span>今日学习</span>
      </div>
      <div class="plan-tags">
        <span>复习 ${i}</span>
        <span>新词 ${a}</span>
        <label class="plan-size" for="words-per-game">
          每局
          <select id="words-per-game" aria-label="每局单词数">${De(t)}</select>
          个
        </label>
      </div>
      <button class="btn primary hero-action" id="start-daily" ${o?``:`disabled`}>
        ${o?`开始 · ${n.length} 个词`:e.words.length?`今日已完成`:`先导入单词`}
      </button>
    </section>

    <section class="card section-gap">
      <h2>自由练习</h2>
      <p>从所选范围随机抽取 ${t} 个单词；不足时使用全部单词。自由练习只记录统计，不改变复习进度。</p>
      <div class="grid two actions-spaced">
        <div class="field">
          <label for="practice-scope">练习范围</label>
          <select class="select" id="practice-scope" ${e.words.length?``:`disabled`}>
            <option value="all">全部单词</option>
            ${s}
          </select>
        </div>
        <div class="field align-end">
          <button class="btn soft" id="start-practice" ${e.words.length?``:`disabled`}>随机消词</button>
        </div>
      </div>
    </section>
  `}function De(t){return e.map(e=>`<option value="${e}" ${e===t?`selected`:``}>${e}</option>`).join(``)}function Oe(e){let t=new Map(e.progress.map(e=>[e.wordId,e]));return`
    <section class="page-head">
      <div>
        <h1>单词</h1>
        <p>按单元管理，可直接从 Excel / WPS 的英文、中文两列复制导入。</p>
      </div>
      <div class="button-row">
        <button class="btn primary" id="new-unit">新建单元</button>
      </div>
    </section>
    <section class="unit-list">
      ${[...e.units].sort((e,t)=>e.createdAt-t.createdAt).map(n=>{let r=e.words.filter(e=>e.unitId===n.id),i=r.filter(e=>t.has(e.id)).length,a=r.filter(e=>(t.get(e.id)?.level??0)>=7).length;return`
        <div class="unit-row">
          <button class="unit-open" data-unit-open="${T(n.id)}">
            <span>
              <strong>${w(n.name)}</strong>
              <small>${r.length} 词 · ${i} 已学习 · ${a} 已掌握</small>
            </span>
            <span class="unit-arrow" aria-hidden="true">›</span>
          </button>
        </div>
      `}).join(``)||`<div class="empty">还没有单元。先新建一个单元，再粘贴导入单词。</div>`}
    </section>
  `}function ke(e,t){let n=e.units.find(e=>e.id===t);if(!n)return`<div class="empty">单元不存在。</div>`;let r=e.words.filter(e=>e.unitId===t),i=new Map(e.progress.map(e=>[e.wordId,e])),a=r.filter(e=>i.has(e.id)).length,o=r.filter(e=>(i.get(e.id)?.level??0)>=7).length,s=r.map(e=>{let t=i.get(e.id);return`
        <div class="word-row">
          <div class="word-copy">
            <strong>${w(e.term)}</strong>
            <span>${w(e.meaning)}</span>
          </div>
          <div class="button-row word-actions">
            <span class="word-meta">${Pe(t)}</span>
            <button class="btn icon" data-word-edit="${T(e.id)}">编辑</button>
          </div>
        </div>
      `}).join(``);return`
    <button class="back-link" id="back-from-unit">← 返回单元</button>
    <section class="page-head">
      <div>
        <h1>${w(n.name)}</h1>
        <p>${r.length} 词 · ${a} 已学习 · ${o} 已掌握</p>
      </div>
      <div class="button-row">
        <button class="btn primary" id="import-unit">导入 / 更新</button>
        <button class="btn" id="rename-unit">重命名</button>
        <button class="btn danger" id="delete-unit">删除</button>
      </div>
    </section>
    <section class="word-list">
      ${s||`<div class="empty">这个单元还是空的。点击「导入 / 更新」粘贴单词列表。</div>`}
    </section>
  `}function Ae(e,t,n,r){let i=e.units.find(e=>e.id===t);return i?`
    <button class="back-link" id="back-from-import">← 返回 ${w(i.name)}</button>
    <section class="page-head">
      <div>
        <h1>导入 / 更新</h1>
        <p>每行固定两列，以 Tab 分隔。建议直接从 Excel / WPS 的英文、中文两列复制粘贴；文本框已带出当前单元完整内容。</p>
      </div>
    </section>

    <section class="card">
      <div class="field">
        <label for="import-text">单词列表</label>
        <textarea class="textarea" id="import-text" spellcheck="false" placeholder="从 Excel / WPS 复制英文、中文两列后粘贴到这里">${w(n)}</textarea>
      </div>
      <div class="button-row actions-spaced">
        <button class="btn primary" id="preview-import">生成预览</button>
      </div>
      <div id="import-preview">${xe(r)}</div>
    </section>
  `:`<div class="empty">单元不存在。</div>`}function j(e,t,n){return t.length?`
    <div class="diff-section">
      <h3>${w(e)}</h3>
      <div class="diff-list">
        ${t.map(e=>`<div class="diff-item ${n}">${w(e)}</div>`).join(``)}
      </div>
    </div>
  `:``}function je(e,t){if(!t)return`<div class="empty">没有待开始的学习内容。</div>`;let n=new Set(e.progress.map(e=>e.wordId)),r=t.words.filter(e=>!n.has(e.id));return`
    <button class="back-link" id="back-from-preview">← 返回学习</button>
    <section class="page-head">
      <div>
        <h1>先看一遍</h1>
        <p>本局有 ${r.length} 个新词。先建立一次中英联系，点击英文可以听发音。</p>
      </div>
    </section>
    <section class="preview-list">
      ${r.map(e=>`
            <button class="preview-row" data-preview-speak="${T(e.id)}">
              <strong>${w(e.term)}</strong>
              <span>${w(e.meaning)}</span>
              <small aria-hidden="true">🔊</small>
            </button>
          `).join(``)}
    </section>
    <div class="preview-action">
      <button class="btn primary" id="begin-preview-game">开始消词</button>
    </div>
  `}function Me(e){let t=Fe(Date.now()),n=new Date(t);n.setDate(n.getDate()-6);let r=n.getTime(),i=e.sessions.filter(e=>e.date>=t),a=e.sessions.filter(e=>e.date>=r),o=e.sessions.reduce((e,t)=>e+t.correct,0),s=o+e.sessions.reduce((e,t)=>e+t.wrong,0),c=s?Math.round(o/s*100):0;return`
    <section class="page-head">
      <div>
        <h1>统计</h1>
        <p>只保留对学习有用的少量汇总。</p>
      </div>
    </section>

    <section class="grid two">
      <div class="card">
        <h2>词汇</h2>
        <div class="stat-list stats-spaced">
          ${M(`总词数`,e.words.length)}
          ${M(`已学习`,e.progress.length)}
          ${M(`已掌握`,pe(e))}
          ${M(`当前待复习`,S(e).length)}
        </div>
      </div>
      <div class="card">
        <h2>练习</h2>
        <div class="stat-list stats-spaced">
          ${M(`今日完成`,i.reduce((e,t)=>e+t.words,0))}
          ${M(`近 7 天完成`,a.reduce((e,t)=>e+t.words,0))}
          ${M(`累计局数`,e.sessions.length)}
          ${M(`正确率`,`${c}%`)}
        </div>
      </div>
    </section>

    <section class="card section-gap">
      <h2>数据</h2>
      <p>所有数据都在当前浏览器的 localStorage 中。建议偶尔导出 JSON 备份。</p>
      <div class="button-row actions-spaced">
        <button class="btn" id="backup-export">导出数据</button>
        <button class="btn" id="backup-import">恢复数据</button>
        <input type="file" id="backup-file" accept="application/json,.json" hidden>
      </div>
    </section>
  `}function M(e,t){return`<div class="stat-row"><strong>${w(e)}</strong><span>${w(String(t))}</span></div>`}function Ne(e,t){let n=e.selectedCardId===t.id;return`
    <button
      class="game-card ${t.kind} ${n?`selected`:``} ${t.matched?`matched`:``}"
      data-card-id="${T(t.id)}"
      ${t.matched||e.locked?`disabled`:``}
    >${w(t.text)}</button>
  `}function Pe(e,t=Date.now()){if(!e)return`未学习`;if(e.level>=7)return`已掌握`;if(e.nextReviewAt===null)return`复习中`;let n=e.nextReviewAt-t;if(n<=0)return`待复习`;let r=Math.ceil(n/6e4);if(r<60)return`${r} 分钟后`;let i=Math.ceil(n/36e5);return i<24?`${i} 小时后`:`${Math.ceil(n/864e5)} 天后`}function Fe(e){let t=new Date(e);return t.setHours(0,0,0,0),t.getTime()}var N=`alpha-trion-vocab`,Ie=document.querySelector(`#app`);if(!Ie)throw Error(`App root was not found.`);var P=Ie,F=a(),I=!1;try{F=o()}catch(e){I=!0,console.error(`Failed to load local data.`,e)}var L={page:`study`},R=null,z=[],B=`消词`,V=`practice`,H=!1,U=null,W=null,G=``,K=l();window.history.replaceState({app:N,route:L},``),window.addEventListener(`popstate`,e=>{let t=e.state;L=t?.app===N&&t.route?t.route:{page:`study`},q(),Ze()}),q();function q(){if(I){Le();return}if(L.page===`game`){J();return}P.innerHTML=ve({data:F,route:L,wordsPerGame:K,importText:G,importDiff:W,pendingGame:U}),Re(),ze()}function Le(){P.innerHTML=ye();let e=document.querySelector(`#fatal-file`);document.querySelector(`#fatal-restore`)?.addEventListener(`click`,()=>e?.click()),e?.addEventListener(`change`,async()=>{let t=e.files?.[0];if(t)try{let e=f(await t.text());s(e),F=e,I=!1,X({page:`study`},!0)}catch{await D(`无法恢复`,`这个文件不是当前版本可识别的 Alpha Trion Vocab 备份，或者浏览器无法保存数据。`)}finally{e.value=``}}),document.querySelector(`#fatal-reset`)?.addEventListener(`click`,async()=>{if(await E(`清空本地数据？`,`这会删除当前浏览器里的损坏数据。只有在没有可用备份时再这样做。`,`清空`,!0))try{c(),F=a(),I=!1,X({page:`study`},!0)}catch{await D(`无法清空`,`浏览器当前无法访问 localStorage。`)}})}function J(){if(!R){X({page:`study`},!0);return}if(P.innerHTML=Se(R,B,V),x(R)){document.querySelector(`#game-again`)?.addEventListener(`click`,()=>{Y(V===`daily`?R?.words??[]:z,B,`practice`,!1,!0)}),document.querySelector(`#game-home`)?.addEventListener(`click`,()=>Z({page:`study`}));return}document.querySelector(`#quit-game`)?.addEventListener(`click`,async()=>{await E(`退出本局？`,`当前这局不会计入学习记录。`,`退出`)&&Z({page:`study`})}),document.querySelectorAll(`[data-card-id]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.cardId;t&&qe(t)})})}function Re(){document.querySelectorAll(`[data-nav]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.nav;t&&X({page:t})})})}function ze(){switch(L.page){case`study`:Be();break;case`words`:Ve();break;case`stats`:Ke();break;case`unit`:He(L.unitId);break;case`import`:Ue(L.unitId);break;case`preview`:Ge()}}function Be(){document.querySelector(`#start-daily`)?.addEventListener(`click`,()=>{let e=C(F,K);if(!e.length)return;let t=new Set(F.progress.map(e=>e.wordId));if(e.some(e=>!t.has(e.id))){U={words:e,title:`今日学习`,mode:`daily`},X({page:`preview`});return}Y(e,`今日学习`,`daily`)}),document.querySelector(`#words-per-game`)?.addEventListener(`change`,e=>{let n=Number(e.currentTarget.value);t(n)&&(K=n,u(n),q())}),document.querySelector(`#start-practice`)?.addEventListener(`click`,()=>{let e=document.querySelector(`#practice-scope`);if(!e)return;let t=e.value===`all`?F.words:F.words.filter(t=>t.unitId===e.value);t.length&&Y(t,e.value===`all`?`全部单词`:$(e.value)?.name??`自由练习`,`practice`)})}function Ve(){document.querySelector(`#new-unit`)?.addEventListener(`click`,async()=>{let e=await ge(`新建单元`,`单元名称`,`例如：三上 Unit 1`);if(!e)return;let t={id:oe(),name:e,createdAt:Date.now()};Q({...F,units:[...F.units,t]})&&X({page:`unit`,unitId:t.id})}),document.querySelectorAll(`[data-unit-open]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.unitOpen;t&&X({page:`unit`,unitId:t})})})}function He(e){document.querySelector(`#back-from-unit`)?.addEventListener(`click`,()=>Z({page:`words`})),document.querySelector(`#import-unit`)?.addEventListener(`click`,()=>{G=se(F.words.filter(t=>t.unitId===e)),W=null,X({page:`import`,unitId:e})}),document.querySelector(`#rename-unit`)?.addEventListener(`click`,async()=>{let t=$(e);if(!t)return;let n=await ge(`重命名单元`,`单元名称`,``,t.name);!n||n===t.name||Q({...F,units:F.units.map(t=>t.id===e?{...t,name:n}:t)})&&q()}),document.querySelector(`#delete-unit`)?.addEventListener(`click`,async()=>{let t=$(e);if(!t||!await E(`删除「${t.name}」？`,`该单元的单词和对应学习进度会一起删除，历史统计保留。`,`删除`,!0))return;let n=new Set(F.words.filter(t=>t.unitId===e).map(e=>e.id));Q({...F,units:F.units.filter(t=>t.id!==e),words:F.words.filter(t=>t.unitId!==e),progress:F.progress.filter(e=>!n.has(e.wordId))})&&Z({page:`words`})}),document.querySelectorAll(`[data-word-edit]`).forEach(t=>{t.addEventListener(`click`,async()=>{let r=F.words.find(e=>e.id===t.dataset.wordEdit);if(!r)return;let i=await _e(r);if(i){if(F.words.some(t=>t.unitId===e&&t.id!==r.id&&n(t.term)===n(i.term))){await D(`无法保存`,`同一单元内已经存在这个英文单词。`);return}Q({...F,words:F.words.map(e=>e.id===r.id?{...e,term:i.term,meaning:i.meaning}:e)})&&q()}})})}function Ue(e){document.querySelector(`#back-from-import`)?.addEventListener(`click`,()=>Z({page:`unit`,unitId:e}));let t=document.querySelector(`#import-text`);t?.addEventListener(`input`,()=>{G=t.value,W=null,document.querySelector(`#import-preview`)?.replaceChildren()}),document.querySelector(`#preview-import`)?.addEventListener(`click`,()=>{G=t?.value??G;let n=ce(G),r=document.querySelector(`#import-preview`);if(n.errors.length){W=null,r&&(r.innerHTML=be(n.errors));return}W=le(F,e,n.words),r&&(r.innerHTML=xe(W)),We(e)}),We(e)}function We(e){document.querySelector(`#apply-import`)?.addEventListener(`click`,async()=>{W&&(!W.removed.length||await E(`确认更新单元？`,`这次同步会删除 ${W.removed.length} 个不再出现在当前列表中的单词及其学习进度。`,`更新并删除`,!0))&&Q(ue(F,e,W))&&(W=null,G=``,Z({page:`unit`,unitId:e}))})}function Ge(){document.querySelector(`#back-from-preview`)?.addEventListener(`click`,()=>Z({page:`study`})),document.querySelectorAll(`[data-preview-speak]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=U?.words.find(t=>t.id===e.dataset.previewSpeak);t&&Xe(t.term)})}),document.querySelector(`#begin-preview-game`)?.addEventListener(`click`,()=>{if(!U)return;let e=U;U=null,Y(e.words,e.title,e.mode,!0,!0)})}function Ke(){document.querySelector(`#backup-export`)?.addEventListener(`click`,()=>{try{d(F)}catch{D(`无法导出`,`当前数据未能通过完整性检查。`)}});let e=document.querySelector(`#backup-file`);document.querySelector(`#backup-import`)?.addEventListener(`click`,()=>e?.click()),e?.addEventListener(`change`,async()=>{let t=e.files?.[0];if(t)try{let e=f(await t.text());if(!await E(`恢复这份备份？`,`恢复会覆盖当前浏览器里的全部词库、进度和统计。`,`恢复`,!0))return;s(e),F=e,q()}catch{await D(`无法恢复`,`这个文件不是当前版本可识别的 Alpha Trion Vocab 备份，或者浏览器无法保存数据。`)}finally{e.value=``}})}function Y(e,t,n,r=!1,i=!1){e.length&&(z=[...e],R=ae(e,r?e.length:K),B=t,V=n,H=!1,X({page:`game`},i))}function qe(e){if(!R||R.locked)return;let t=R.cards.find(t=>t.id===e);if(!t||t.matched)return;if(t.kind===`term`&&Xe(t.text),!R.selectedCardId){R.selectedCardId=t.id,J();return}let n=R.cards.find(e=>e.id===R?.selectedCardId);if(!n||n.id===t.id){R.selectedCardId=null,J();return}if(n.kind===t.kind){R.selectedCardId=t.id,J();return}if(R.locked=!0,n.wordId===t.wordId){n.matched=!0,t.matched=!0,R.correct+=1,R.selectedCardId=null,window.setTimeout(()=>{R&&(R.locked=!1,x(R)&&Ye(),J())},220),J();return}R.wrong+=1,b(R,n.wordId),b(R,t.wordId),R.selectedCardId=null,J(),Je(n.id),Je(t.id),window.setTimeout(()=>{R&&(R.locked=!1,J())},420)}function Je(e){document.querySelector(`[data-card-id="${CSS.escape(e)}"]`)?.classList.add(`wrong`)}function Ye(){!R||H||Q(he(F,R,V))&&(H=!0)}function Xe(e){if(!(`speechSynthesis`in window))return;window.speechSynthesis.cancel();let t=new SpeechSynthesisUtterance(e);t.lang=`en-US`,t.rate=.9,window.speechSynthesis.speak(t)}function X(e,t=!1){L=e;let n={app:N,route:e};t?window.history.replaceState(n,``):window.history.pushState(n,``),q(),Ze()}function Z(e){if(window.history.state?.app===N&&window.history.length>1){window.history.back();return}X(e,!0)}function Ze(){window.scrollTo({top:0,behavior:`instant`})}function Q(e){try{return s(e),F=e,!0}catch(e){return console.error(`Failed to save local data.`,e),D(`保存失败`,`浏览器无法写入 localStorage，本次修改没有保存。`),!1}}function $(e){return F.units.find(t=>t.id===e)}
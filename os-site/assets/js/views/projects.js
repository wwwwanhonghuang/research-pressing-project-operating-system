// Home: the projects on this machine, and a way to start a new one.

import { h, icons } from '../core/dom.js';
import { api, workspace } from '../core/api.js';
import { loadSite } from '../core/data.js';
import { STAGE_STATUS, currentStage, when } from '../core/status.js';
import { go } from '../core/router.js';
import { topbar } from '../ui/chrome.js';
import { openDialog, field, note } from '../ui/dialog.js';
import { swatches, guessLang, workspaceMissing } from './ws.js';

export async function projectsView(view) {
  document.title = 'Projects · Operations OS';
  const main = h('main', { class: 'ws wrap' });
  view.append(topbar('projects'), main);
  if (!(await workspace())) { main.append(workspaceMissing()); return; }
  const [site, projects] = await Promise.all([loadSite(), api.listProjects()]);
  const names = Object.fromEntries(site.stages.map(s => [s.id, s.name_ja]));

  const head = h('header', { class: 'ws-head' },
    h('h1', { class: 'ws-title' }, 'Projects'),
    h('button', { class: 'button', type: 'button', on: { click: () => newProject(site) } }, icons.plus(), 'New project'));

  const list = projects.length
    ? h('ul', { class: 'plist' }, projects.map(p => {
      const at = currentStage(p.stages);
      const done = p.stages.filter(s => s.status === 'completed' || s.status === 'skipped').length;
      return h('li', null, h('a', { class: 'prow', href: `#/p/${p.id}` },
        h('span', { class: 'prow__main' },
          h('span', { class: 'prow__title', lang: guessLang(p.title) }, p.title),
          h('span', { class: 'prow__meta' }, p.id, ' · ', `updated ${when(p.updated_at_utc || p.created_at_utc)}`, p.documents ? ` · ${p.documents} document${p.documents > 1 ? 's' : ''}` : '')),
        h('span', { class: 'prow__progress' },
          swatches(p.stages, names),
          h('span', { class: 'prow__stage' },
            done === p.stages.length ? 'All stages complete'
              : [`Stage ${at.id} `, h('span', { lang: 'ja' }, names[at.id] ?? ''), ` · ${STAGE_STATUS[at.status] ?? at.status}`]))));
    }))
    : h('div', { class: 'empty' },
      h('p', null, 'No projects yet.'),
      h('button', { class: 'button button--quiet', type: 'button', on: { click: () => newProject(site) } }, 'Start the first project'));

  main.append(head, list,
    h('p', { class: 'ws-foot' }, 'Saved as files in ', h('code', null, 'projects/'), ' on this computer. Records stay local and are not committed.'));
}

function slugify(title) {
  const base = title.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s_-]/g, ' ').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
  if (base && /^[a-z0-9]/.test(base)) return base;
  const d = new Date();
  return `project-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

function newProject() {
  const title = h('input', { class: 'inp', id: 'np-title', required: '', maxlength: '200', autocomplete: 'off' });
  const id = h('input', { class: 'inp mono', id: 'np-id', required: '', maxlength: '64', pattern: '[a-z0-9][a-z0-9_-]{0,63}', autocomplete: 'off', spellcheck: 'false' });
  const summary = h('textarea', { class: 'inp', id: 'np-summary', rows: '3', maxlength: '4000' });
  const msg = h('p', { class: 'fmsg', hidden: true });
  let idTouched = false;
  title.addEventListener('input', () => { if (!idTouched) id.value = slugify(title.value); title.lang = guessLang(title.value); });
  id.addEventListener('input', () => { idTouched = true; });
  const create = h('button', { class: 'button', type: 'button' }, 'Create project');
  const form = h('form', { class: 'form' },
    field('Title', title),
    field('Identifier', id, 'Lowercase letters, digits and hyphens. It names the project folder and cannot change.'),
    field('Purpose', summary, 'Optional. One or two sentences on what the project is for.'),
    msg);
  const dlg = openDialog({ title: 'New project', body: form,
    actions: [h('button', { class: 'button button--quiet', type: 'button', on: { click: () => dlg.close() } }, 'Cancel'), create] });
  const submit = async e => {
    e?.preventDefault();
    if (!title.value.trim()) { note(msg, 'Give the project a title.'); title.focus(); return; }
    if (!id.checkValidity()) { note(msg, 'The identifier may use lowercase letters, digits, hyphens and underscores, starting with a letter or digit.'); id.focus(); return; }
    create.disabled = true;
    try {
      const p = await api.createProject({ title: title.value.trim(), id: id.value.trim(), summary: summary.value.trim() });
      dlg.close();
      go(`/p/${p.id}`);
    } catch (err) { note(msg, err.message); create.disabled = false; }
  };
  form.addEventListener('submit', submit);
  create.addEventListener('click', submit);
}

// Transient status message at the top of the screen.
import { $ } from '../dom.js';

let timer;

export function toast(msg, isErr){
  const el = $('toast');
  $('toastMsg').textContent = msg;
  el.classList.toggle('err', !!isErr);
  el.classList.add('show');
  clearTimeout(timer);
  timer = setTimeout(() => el.classList.remove('show'), 3200);
}

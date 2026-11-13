// Small DOM helpers.

export function $(id){
  return document.getElementById(id);
}

// Segmented button group (<div class="seg"> with <button aria-pressed>):
// marks the clicked button as pressed and calls onSelect(button).
export function bindSegmented(el, onSelect){
  el.addEventListener('click', e => {
    const b = e.target.closest('button');
    if(!b || !el.contains(b)) return;
    for(const c of el.children) c.setAttribute('aria-pressed', c === b ? 'true' : 'false');
    onSelect(b);
  });
}

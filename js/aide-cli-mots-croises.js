'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const blocks = document.querySelectorAll('.cli-help pre');

  blocks.forEach((pre) => {
    const code = pre.querySelector('code');
    if (!code) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'code-block';
    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'code-copy';
    button.setAttribute('aria-label', 'Copier la commande');
    button.title = 'Copier';
    button.innerHTML = '<i class="fa-solid fa-copy" aria-hidden="true"></i><span class="code-copy-label">Copier</span>';

    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code.textContent || '');
        button.classList.add('is-copied');
        button.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i><span class="code-copy-label">Copié</span>';
        window.setTimeout(() => {
          button.classList.remove('is-copied');
          button.innerHTML = '<i class="fa-solid fa-copy" aria-hidden="true"></i><span class="code-copy-label">Copier</span>';
        }, 1400);
      } catch (error) {
        button.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i><span class="code-copy-label">Impossible de copier</span>';
        window.setTimeout(() => {
          button.innerHTML = '<i class="fa-solid fa-copy" aria-hidden="true"></i><span class="code-copy-label">Copier</span>';
        }, 1400);
      }
    });

    wrapper.appendChild(button);
  });
});

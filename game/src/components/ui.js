export function createHud(onRestart) {
  const hud = document.createElement('div');
  hud.className = 'hud';

  hud.innerHTML = `
    <div class="hud__bar">
      <div class="hud__stat"><span>Crystals</span><strong data-crystals>0/0</strong></div>
      <div class="hud__stat"><span>Health</span><strong data-health>3</strong></div>
      <div class="hud__stat"><span>Time</span><strong data-time>0:00</strong></div>
    </div>
    <button class="restart" type="button">Restart</button>
    <div class="message" data-message hidden>
      <strong data-title></strong>
      <span data-subtitle></span>
    </div>
  `;

  document.body.append(hud);

  const crystals = hud.querySelector('[data-crystals]');
  const health = hud.querySelector('[data-health]');
  const time = hud.querySelector('[data-time]');
  const message = hud.querySelector('[data-message]');
  const title = hud.querySelector('[data-title]');
  const subtitle = hud.querySelector('[data-subtitle]');
  const restart = hud.querySelector('.restart');

  restart.addEventListener('click', onRestart);

  return {
    update(game) {
      crystals.textContent = `${game.collected}/${game.totalCrystals}`;
      health.textContent = String(game.health);
      time.textContent = formatTime(game.elapsed);
      message.hidden = game.status === 'playing';

      if (game.status === 'won') {
        title.textContent = 'Cleared';
        subtitle.textContent = 'The village is bright again.';
      }

      if (game.status === 'lost') {
        title.textContent = 'Down';
        subtitle.textContent = 'Take another run at it.';
      }
    },
  };
}

function formatTime(seconds) {
  const whole = Math.floor(seconds);
  const minutes = Math.floor(whole / 60);
  const remainder = String(whole % 60).padStart(2, '0');

  return `${minutes}:${remainder}`;
}

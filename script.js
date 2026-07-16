const printButton = document.querySelector('#print-workbook');
if (printButton) printButton.addEventListener('click', () => window.print());

const audioPlayers = document.querySelectorAll('audio');
audioPlayers.forEach((player) => {
  player.addEventListener('play', () => {
    audioPlayers.forEach((otherPlayer) => {
      if (otherPlayer !== player && !otherPlayer.paused) otherPlayer.pause();
    });
  });
});

document.addEventListener('DOMContentLoaded', function() {
  const statsBtn = document.getElementById('statsButton');
  const profileContainer = document.querySelector('.profile-container');

  statsBtn.addEventListener('click', function() {
    profileContainer.innerHTML = '';
    profileContainer.style.width = '70vw';
    profileContainer.style.height = '70vh';

  });
});

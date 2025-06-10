function hideLoading(){
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = 'none';
}


document.addEventListener('DOMContentLoaded', () => {
    const avatar = document.getElementById('burgerToggle');
    const sideMenu = document.getElementById('sideMenu');
  
    avatar.addEventListener('click', () => {
      sideMenu.classList.toggle('open');
    });
  
    // Optional: sluit menu als je buiten klikt
    document.addEventListener('click', (e) => {
      if (!sideMenu.contains(e.target) && !avatar.contains(e.target)) {
        sideMenu.classList.remove('open');
      }
    });
    hideLoading();
  });
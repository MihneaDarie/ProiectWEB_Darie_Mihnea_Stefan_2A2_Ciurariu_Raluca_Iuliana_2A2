window.showPassword = function(id) {
  const input = document.getElementById(id);
  if (input) {
    input.type = input.type === 'password' ? 'text' : 'password';
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const loginForm    = document.getElementById('loginForm');
  const loginMessage = document.getElementById('loginMessage');
  const username     = document.getElementById('username');
  const password     = document.getElementById('loginPassword');

  const resetMessages = () => {
    loginMessage.textContent = '';
    username.classList.remove("invalid");
    password.classList.remove("invalid");
    username.placeholder = "Username";
    password.placeholder = "Password";
  };

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    resetMessages();

    let hasError = false;
    if (username.value.trim() === "") {
      username.placeholder = "Please enter your username.";
      username.classList.add("invalid");
      hasError = true;
    }
    if (password.value.trim() === "") {
      password.placeholder = "Password is required.";
      password.classList.add("invalid");
      hasError = true;
    }
    if (hasError) return;

    loginMessage.textContent = 'Se încarcă...';

    const payload = {
      username: username.value.trim(),
      password: password.value.trim()
    };

    try {
      const response = await fetch(
        '/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/api.php?page=login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        throw new Error('Cod HTTP: ' + response.status);
      }

      const data = await response.json();
      console.log('↪ Răspuns JSON complet:', data, 'typeof success =', typeof data.success);

      const isOk =  data.success === true ||
                    data.success === 'true' ||
                    data.success === 1    ||
                    data.success === '1';

      if (isOk) {
        console.log('⇢ Redirect spre generator');
        window.location.href = '/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/index.php?page=generator';
        return;
      } else {
        console.log('✘ Nu intră în ramura de succes, data.success =', data.success);
        loginMessage.textContent = data.message;
      }
    } catch (err) {
      console.error('Eroare în fetch/JSON:', err);
      loginMessage.textContent = 'Eroare de rețea sau server.';
    }
  });

  document.querySelectorAll('button[data-show-password]').forEach(button => {
    button.addEventListener('click', () => {
      const inputId = button.dataset.showPassword;
      showPassword(inputId);
    });
  });
});

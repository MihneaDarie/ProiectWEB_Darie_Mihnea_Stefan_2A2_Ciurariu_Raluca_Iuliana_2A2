window.showPassword = function(id) {
  const input = document.getElementById(id);
  if (input) {
    input.type = input.type === 'password' ? 'text' : 'password';
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const loginMessage = document.getElementById('loginMessage');
  const username = document.getElementById('username');
  const password = document.getElementById('loginPassword');

  const resetMessages = () => {
    while (loginMessage.firstChild) {
      loginMessage.removeChild(loginMessage.firstChild);
    }

    username.classList.remove("invalid");
    password.classList.remove("invalid");
    username.placeholder = "Username";
    password.placeholder = "Password";
  };

  const createMessage = (text, color, isSubMessage = false) => {
    const messageDiv = document.createElement('div');
    messageDiv.style.color = color;
    messageDiv.textContent = text;
    
    if (isSubMessage) {
      messageDiv.style.fontSize = '14px';
      messageDiv.style.marginTop = '5px';
      messageDiv.style.color = '#6c757d';
    } else {
      messageDiv.style.fontWeight = 'bold';
    }
    
    return messageDiv;
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

    const loadingMsg = createMessage('Loading...', '#6c757d');
    loginMessage.appendChild(loadingMsg);

    const submitButton = loginForm.querySelector('button[type="submit"]');
    const submitSpan = submitButton.querySelector('span');
    const originalText = submitSpan.textContent;
    submitButton.disabled = true;
    submitSpan.textContent = 'Processing...';

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
        throw new Error('HTTP Code: ' + response.status);
      }

      const data = await response.json();
      console.log('Complete JSON response:', data, 'typeof success =', typeof data.success);

      while (loginMessage.firstChild) {
        loginMessage.removeChild(loginMessage.firstChild);
      }

      const isOk = data.success === true ||
                   data.success === 'true' ||
                   data.success === 1 ||
                   data.success === '1';

      if (isOk) {
        console.log('⇢ Redirect to generator');
        const successMsg = createMessage('Login successful!', '#28a745');
        loginMessage.appendChild(successMsg);
        window.location.href = '/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/index.php?page=generator';

      } else {
        console.log('Not entering success branch, data.success =', data.success);
        
        const errorMsg = createMessage(data.message || 'Login failed. Please try again.', '#dc3545');
        loginMessage.appendChild(errorMsg);
        submitButton.disabled = false;
        submitSpan.textContent = originalText;
      }
    } catch (err) {
      console.error('Error in fetch/JSON:', err);
      
      while (loginMessage.firstChild) {
        loginMessage.removeChild(loginMessage.firstChild);
      }
      
      const networkErrorMsg = createMessage('Network or server error. Please try again.', '#dc3545');
      loginMessage.appendChild(networkErrorMsg);
      submitButton.disabled = false;
      submitSpan.textContent = originalText;
    }
  });

  document.querySelectorAll('button[data-show-password]').forEach(button => {
    button.addEventListener('click', () => {
      const inputId = button.dataset.showPassword;
      showPassword(inputId);
    });
  });
});
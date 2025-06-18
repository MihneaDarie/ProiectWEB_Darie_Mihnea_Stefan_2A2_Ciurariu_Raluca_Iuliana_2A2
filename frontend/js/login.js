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
        console.log('⇢ Login successful, checking redirect...', data);
        
        const successMsg = createMessage('Login successful!', '#28a745');
        loginMessage.appendChild(successMsg);

        const redirectPage = data.redirect || 'generator';
        const userRole = data.role || 'user';
        
        console.log('User role:', userRole, 'Redirect to:', redirectPage);
        

        if (userRole === 'admin') {
          const roleMsg = createMessage('Welcome Admin! Redirecting to admin panel...', '#17a2b8', true);
          loginMessage.appendChild(roleMsg);
        } else {
          const roleMsg = createMessage('Redirecting to dashboard...', '#17a2b8', true);
          loginMessage.appendChild(roleMsg);
        }
        
        // Redirect after a short delay to show the message
        setTimeout(() => {
          window.location.href = `/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/index.php?page=${redirectPage}`;
        }, 1500);

      } else {
        console.log('Not entering success branch, data.success =', data.success);
        
        const errorMsg = createMessage(data.message || 'Login failed. Please try again.', '#dc3545');
        loginMessage.appendChild(errorMsg);
        
        // Add specific error handling for different scenarios
        if (data.message && data.message.includes('Username does not exist')) {
          username.classList.add("invalid");
          username.placeholder = "Username not found";
        } else if (data.message && data.message.includes('Incorrect password')) {
          password.classList.add("invalid");
          password.placeholder = "Wrong password";
        }
        
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

      const retryMsg = createMessage('Please check your internet connection and try again.', '#6c757d', true);
      loginMessage.appendChild(retryMsg);
      
      submitButton.disabled = false;
      submitSpan.textContent = originalText;
    }
  });

  document.querySelectorAll('button[data-show-password]').forEach(button => {
    button.addEventListener('click', () => {
      const inputId = button.dataset.showPassword;
      const input = document.getElementById(inputId);
      const icon = button.querySelector('i');
      
      if (input) {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';

        if (icon) {
          icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
        }

        button.title = isPassword ? 'Hide password' : 'Show password';
      }
    });
  });

  document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !submitButton.disabled) {
      const activeElement = document.activeElement;
      if (activeElement === username || activeElement === password) {
        loginForm.dispatchEvent(new Event('submit'));
      }
    }
  });

  if (username) {
    username.focus();
  }

  username.addEventListener('input', () => {
    if (username.classList.contains('invalid')) {
      username.classList.remove('invalid');
      username.placeholder = 'Username';
    }
  });

  password.addEventListener('input', () => {
    if (password.classList.contains('invalid')) {
      password.classList.remove('invalid');
      password.placeholder = 'Password';
    }
  });
});
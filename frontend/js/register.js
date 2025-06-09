window.showPassword = function(id) {
    const input = document.getElementById(id);
    if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const registerMessage = document.getElementById('registerMessage');
    const username = document.getElementById("username");
    const firstpassword = document.getElementById("firstPassword");
    const secondpassword = document.getElementById("secondPassword");
    const email = document.getElementById("email");

    const resetMessages = () => {
        while (registerMessage.firstChild) {
            registerMessage.removeChild(registerMessage.firstChild);
        }

        username.classList.remove("invalid");
        firstpassword.classList.remove("invalid");
        secondpassword.classList.remove("invalid");
        email.classList.remove("invalid");

        username.placeholder = "Username";
        firstpassword.placeholder = "Parola";
        secondpassword.placeholder = "Reintroduceti parola";
        email.placeholder = "Email";
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

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        resetMessages();
        let hasError = false;

        if (username.value.trim() === "") {
            username.placeholder = "Please enter your username.";
            username.classList.add("invalid");
            hasError = true;
        }

        if (firstpassword.value.trim() === "") {
            firstpassword.placeholder = "Password is required.";
            firstpassword.classList.add("invalid");
            hasError = true;
        }

        if (secondpassword.value.trim() === "") {
            secondpassword.placeholder = "Confirm your password.";
            secondpassword.classList.add("invalid");
            hasError = true;
        }

        if (email.value.trim() === "") {
            email.placeholder = "Email is required.";
            email.classList.add("invalid");
            hasError = true;
        }

        if (hasError) return;
        const loadingMsg = createMessage('Se încarcă...', '#6c757d');
        registerMessage.appendChild(loadingMsg);
        const submitButton = registerForm.querySelector('button[type="submit"]');
        const submitSpan = submitButton.querySelector('span');
        const originalText = submitSpan.textContent;
        submitButton.disabled = true;
        submitSpan.textContent = 'Processing...';

        try {
            const payload = {
                username: registerForm.username.value,
                password: registerForm.password.value,
                copy_password: registerForm.copy_password.value,
                email: registerForm.email.value
            };

            const response = await fetch(
                '/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/api.php/?page=register',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }
            );

            const data = await response.json();
            while (registerMessage.firstChild) {
                registerMessage.removeChild(registerMessage.firstChild);
            }

            if (data.success) {
                const successMsg = createMessage(data.message, '#28a745');
                registerMessage.appendChild(successMsg);
                
                const redirectMsg = createMessage('Redirecting to login...', '#6c757d', true);
                registerMessage.appendChild(redirectMsg);
                registerForm.reset();
                window.location.href = 'index.php?page=login';

            } else {
                const errorMsg = createMessage(data.message, '#dc3545');
                registerMessage.appendChild(errorMsg);
                submitButton.disabled = false;
                submitSpan.textContent = originalText;
            }

        } catch (error) {
    
            while (registerMessage.firstChild) {
                registerMessage.removeChild(registerMessage.firstChild);
            }
            const networkErrorMsg = createMessage('Network error. Please try again.', '#dc3545');
            registerMessage.appendChild(networkErrorMsg);
            submitButton.disabled = false;
            submitSpan.textContent = originalText;
        }
    });

    const showPasswordButtons = document.querySelectorAll('button[data-show-password]');
    showPasswordButtons.forEach(button => {
        button.addEventListener('click', () => {
            const inputId = button.dataset.showPassword;
            showPassword(inputId);
        });
    });
});
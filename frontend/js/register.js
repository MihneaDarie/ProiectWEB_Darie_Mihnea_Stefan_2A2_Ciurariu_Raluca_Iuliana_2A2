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
        registerMessage.textContent = '';

        username.classList.remove("invalid");
        firstpassword.classList.remove("invalid");
        secondpassword.classList.remove("invalid");
        email.classList.remove("invalid");

        username.placeholder = "Username";
        firstpassword.placeholder = "Parola";
        secondpassword.placeholder = "Reintroduceti parola";
        email.placeholder = "Email";
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

        registerMessage.textContent = 'Se încarcă...';

        const payload = {
            username: registerForm.username.value,
            password: registerForm.password.value,
            copy_password: registerForm.copy_password.value,
            email: registerForm.email.value
        };

        const response = await fetch(
            '/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/Controllers/api.php/register',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }
        );

        const data = await response.json();
        registerMessage.textContent = data.message;
        if (data.success) registerForm.reset();
    });

    const showPasswordButtons = document.querySelectorAll('button[data-show-password]');
    showPasswordButtons.forEach(button => {
        button.addEventListener('click', () => {
            const inputId = button.dataset.showPassword;
            showPassword(inputId);
        });
    });
});
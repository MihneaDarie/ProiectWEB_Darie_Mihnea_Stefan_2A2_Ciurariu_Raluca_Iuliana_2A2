window.showPassword = function(id) {
    const input = document.getElementById(id);
    if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
    }
};

document.addEventListener('DOMContentLoaded', () => {

    const loginForm = document.getElementById('loginForm');
    const loginMessage = document.getElementById('loginMessage');
    const username = document.getElementById("username");
    const password = document.getElementById("loginPassword");

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
            username.placeholder = "Please enter your username .";
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
            username: loginForm.username.value,
            password: loginForm.password.value
        };

        const response = await fetch(
            '/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/Controllers/api.php/login',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }
        );

        const data = await response.json();
        loginMessage.textContent = data.message;
        if (data.success) loginForm.reset();
    });

    const showPasswordButtons = document.querySelectorAll('button[data-show-password]');
    showPasswordButtons.forEach(button => {
        button.addEventListener('click', () => {
            const inputId = button.dataset.showPassword;
            showPassword(inputId);
        });
    });
});

window.showPassword = function(id) {
    const input = document.getElementById(id);
    if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const registerMessage = document.getElementById('registerMessage');

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
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
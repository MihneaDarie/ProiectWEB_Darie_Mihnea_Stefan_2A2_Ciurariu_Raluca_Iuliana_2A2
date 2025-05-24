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

        const formData = new FormData(registerForm);
        formData.append('action', 'register');

        const response = await fetch('/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/pig/Controllers/handler.php', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        registerMessage.textContent = data.message;
        if (data.success) registerForm.reset();
    });

    const loginForm = document.getElementById('loginForm');
    const loginMessage = document.getElementById('loginMessage');
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginMessage.textContent = 'Se încarcă...';

        const formData = new FormData(loginForm);
        formData.append('action', 'login');

        const response = await fetch('/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/pig/Controllers/handler.php', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        loginMessage.textContent = data.message;
        if (data.success) loginForm.reset();
    });

    const showPasswordButton=document.querySelectorAll('button[data-show-password]');
    showPasswordButton.forEach(button=>{
        button.addEventListener('click', () => {
            const inputId = button.dataset.showPassword;
            showPassword(inputId);
        });
    }
    )

});
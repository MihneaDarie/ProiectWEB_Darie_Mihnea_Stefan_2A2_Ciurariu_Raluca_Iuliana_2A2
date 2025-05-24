<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8" />
    <title>Autentificare și Înregistrare</title>
</head>
<body>

<h2>Înregistrare</h2>
<form id="registerForm">
    <div><input type="text" name="username" placeholder="Nume utilizator"  autocomplete="username" required /></div>
    
    <div>
        <input type="password" id="firstPassword" name="password" placeholder="Parola" autocomplete="new-password" required />
        <button type="button" data-show-password="firstPassword"> 👁️ </button>
    </div>
    
    <div>
        <input type="password" id="secondPassword" name="copy_password" placeholder="Confirmare parola" autocomplete="new-password" required />
        <button type="button" data-show-password="secondPassword"> 👁️ </button>
    </div>
    
    <div>
        <input type="email" name="email" placeholder="Email" autocomplete="email" required />
    </div>

    <button type="submit">Înregistrează-te</button>
</form>
<div id="registerMessage"></div>

<hr>

<h2>Autentificare</h2>
<form id="loginForm">
    <div>
        <input type="text" name="username" placeholder="Nume utilizator"  autocomplete="username" required />
    </div>

    <div>
        <input type="password" id="loginPassword" name="password" placeholder="Parola"  autocomplete="current-password"required />
        <button type="button" data-show-password="loginPassword"> 👁️ </button>
    </div>

    <button type="submit">Autentificare</button>
</form>
<div id="loginMessage"></div>

<script src="/pig/auth.js" defer ></script>

</body>
</html>
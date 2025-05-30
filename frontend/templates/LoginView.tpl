<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <title>Login</title>
</head>
<body>

<h2>Login</h2>
<form id="loginForm">
    <div>
        <input type="text" name="username" placeholder="Username" autocomplete="username" required oninvalid="this.setCustomValidity('Fill out this field!🤨')" oninput="this.setCustomValidity('')" />
    </div>

    <div>
        <input type="password" id="loginPassword" name="password" placeholder="Password" autocomplete="current-password" required oninvalid="this.setCustomValidity('Fill out this field!🤨')" oninput="this.setCustomValidity('')" />
        <button type="button" data-show-password="loginPassword"> 👁️ </button>
    </div>

    <button type="submit">Login</button>
</form>
<div id="loginMessage"></div>

<p>
    Don't have an account?
    <a href="index.php?page=register">Register here</a>
</p>

<script src="/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/frontend/js/login.js" defer></script>

</body>
</html>

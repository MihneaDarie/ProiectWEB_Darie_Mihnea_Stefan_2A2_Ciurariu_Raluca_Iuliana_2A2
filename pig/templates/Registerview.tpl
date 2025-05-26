<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <title>Register</title>
</head>
<body>

<h2>Register</h2>
<form id="registerForm">
    <div>
        <input type="text" name="username" placeholder="Username" autocomplete="username" required oninvalid="this.setCustomValidity('Fill out this field!🤨')" oninput="this.setCustomValidity('')" />
    </div>
    
    <div>
        <input type="password" id="firstPassword" name="password" placeholder="Password" autocomplete="new-password" required oninvalid="this.setCustomValidity('Fill out this field!🤨')" oninput="this.setCustomValidity('')" />
        <button type="button" data-show-password="firstPassword"> 👁️ </button>
    </div>
    
    <div>
        <input type="password" id="secondPassword" name="copy_password" placeholder="Confirm password" autocomplete="new-password" required oninvalid="this.setCustomValidity('Fill out this field!🤨')" oninput="this.setCustomValidity('')" />
        <button type="button" data-show-password="secondPassword"> 👁️ </button>
    </div>
    
    <div>
        <input type="email" name="email" placeholder="Email" autocomplete="email" required oninvalid="this.setCustomValidity('Fill out this field!🤨')" oninput="this.setCustomValidity('')" />
    </div>

    <button type="submit">Register</button>
</form>
<div id="registerMessage"></div>

<p>
    Already have an account?
    <a href="index.php">Back to Login</a>
</p>

<script src="/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/pig/js/register.js" defer></script>

</body>
</html>

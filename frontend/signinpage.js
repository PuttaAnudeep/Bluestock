// Select DOM elements
const togglePassword = document.getElementById('toggle-password');
const passwordInput = document.getElementById('password');
const passwordIcon = document.getElementById('password-icon');

// Add click event to toggle password visibility
togglePassword.addEventListener('click', () => {
    // Check current type of input
    const isPassword = passwordInput.getAttribute('type') === 'password';

    // Toggle between 'password' and 'text'
    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');

    // Toggle icon classes
    passwordIcon.classList.toggle('bi-eye', !isPassword);
    passwordIcon.classList.toggle('bi-eye-slash', isPassword);
});

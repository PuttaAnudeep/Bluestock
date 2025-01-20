const form = document.getElementById('forgot-password-form');
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            alert('Password reset link sent to your email!');
        });
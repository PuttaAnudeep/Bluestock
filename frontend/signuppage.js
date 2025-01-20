document.getElementById("signup-form").addEventListener("submit", function (event) {
    event.preventDefault();

    // Basic validation
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const robotCheck = document.getElementById("robot-check").checked;

    if (!name || !email || !password || !robotCheck) {
        alert("Please fill in all fields and verify you're not a robot.");
        return;
    }

    // Simulate signup success
    alert(`Welcome, ${name}! Your account has been created.`);
});

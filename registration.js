document.getElementById('registrationForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

    const response = await fetch('http://localhost:8090/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password, role })
    });

    if (response.ok) {
        document.getElementById('registrationForm').style.display = 'none';
        document.getElementById('loginPrompt').style.display = 'block';
    } else {
        alert('Registration failed. Please try again.');
    }
});

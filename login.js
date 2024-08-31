document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const response = await fetch('http://localhost:8090/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    });

    if (response.ok) {
        const { token } = await response.json();
        localStorage.setItem('token', token);

        // Fetch user role to determine redirection
        const roleResponse = await fetch('http://localhost:8090/user/role', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (roleResponse.ok) {
            const { role } = await roleResponse.json();
            let redirectUrl = '';
            
            switch (role) {
                case 'admin':
                    redirectUrl = 'admin_dashboard.html';
                    break;
                case 'donor':
                    redirectUrl = 'donor_dashboard.html';
                    break;
                case 'community_manager':
                    redirectUrl = 'community_manager_dashboard.html';
                    break;
            }

            window.location.href = redirectUrl;
        } else {
            alert('Failed to fetch user role.');
        }
    } else {
        alert('Login failed. Please check your credentials.');
    }
});

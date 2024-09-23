document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('createCommunityForm');
    const messageDiv = document.getElementById('message');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const community_name = document.getElementById('community_name').value;
        const location = document.getElementById('location').value;

        // Prepare data for the request
        const communityData = {
            community_name,
            location
        };

        try {
            // Send POST request to the backend
            const response = await fetch('http://localhost:8090/communities', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}` //using JWT stored in localStorage
                },
                body: JSON.stringify(communityData)
            });

            const result = await response.json();

            if (response.ok) {
                messageDiv.innerHTML = `Community created successfully! Community ID: ${result.community_id}`;
                messageDiv.style.color = 'green';
            } else {
                messageDiv.innerHTML = `Error: ${result.message}`;
                messageDiv.style.color = 'red';
            }

        } catch (error) {
            messageDiv.innerHTML = `Error: ${error.message}`;
            messageDiv.style.color = 'red';
        }
    });
});


// assign/reassign community manager
    const form = document.getElementById('assignManagerForm');
    const messageDiv = document.getElementById('message');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const community_id = document.getElementById('community_id').value;
        const manager_id = document.getElementById('manager_id').value;

        try {
            // Send PATCH request to the backend to assign/reassign community manager
            const response = await fetch(`http://localhost:8090/communities/${community_id}/assign-manager`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}` // using JWT stored in localStorage
                },
                body: JSON.stringify({ manager_id })
            });

            const result = await response.json();

            if (response.ok) {
                messageDiv.innerHTML = 'Community manager assigned successfully';
                messageDiv.style.color = 'green';
            } else {
                messageDiv.innerHTML = `Error: ${result.message}`;
                messageDiv.style.color = 'red';
            }

        } catch (error) {
            messageDiv.innerHTML = `Error: ${error.message}`;
            messageDiv.style.color = 'red';
        }
    });



    
    const tableBody = document.querySelector('#communitiesTable tbody');
    const message = document.getElementById('message');
    
    // Define an async function to fetch communities
    async function fetchCommunities() {
        try {
            // Fetch the communities from the backend
            const response = await fetch('http://localhost:8090/communities', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}` // Assuming you're using JWT stored in localStorage
                }
            });
    
            if (!response.ok) {
                const error = await response.json();
                message.innerHTML = `Error: ${error.message}`;
                message.style.color = 'red';
                return;
            }
    
            const communities = await response.json();
    
            // Populate the table with communities
            communities.forEach(community => {
                const row = document.createElement('tr');
    
                row.innerHTML = `
                    <td>${community.community_id}</td>
                    <td>${community.community_name}</td>
                    <td>${community.location}</td>
                    <td>${community.manager_name || 'Unassigned'}</td>
                `;
    
                tableBody.appendChild(row);
            });
    
        } catch (error) {
            message.innerHTML = `Error: ${error.message}`;
            message.style.color = 'red';
        }
    }
    
    // Call the fetch function to execute it
    fetchCommunities();
    
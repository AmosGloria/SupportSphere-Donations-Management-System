document.getElementById('searchDonationsButton').addEventListener('click', async () => {
    const community_id = document.getElementById('searchCommunityID').value;
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`http://localhost:8090/donations${community_id ? `?community_id=${community_id}` : ''}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const donations = await response.json();
            const tbody = document.querySelector('#donationTable tbody');
            tbody.innerHTML = ''; // Clear existing rows

            donations.forEach(donation => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${donation.item_name}</td>
                    <td>${donation.item_type}</td>
                    <td>${donation.value}</td>
                    <td>${donation.quantity}</td>
                    <td>${donation.community_id}</td>
                    <td>${donation.donation_date}</td>
                    <td>${donation.remaining_quantity}</td>
                    <td>${donation.status}</td>
                `;
                tbody.appendChild(row);
            });

            if (donations.length === 0) {
                document.getElementById('message').textContent = 'No donations found.';
            }
        } else {
            document.getElementById('message').textContent = 'Failed to fetch donations.';
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('message').textContent = 'An error occurred. Please try again later.';
    }
});

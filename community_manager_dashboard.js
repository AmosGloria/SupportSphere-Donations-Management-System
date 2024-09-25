document.addEventListener('DOMContentLoaded', function() {
    fetchDonations();

    async function fetchDonations() {
        try {
            const response = await fetch('http://localhost:8090/community/donations', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('token') // Assuming JWT is stored in localStorage
                }
            });

            if (response.ok) {
                const donations = await response.json();
                displayDonations(donations);
            } else if (response.status === 403) {
                alert('Access denied. Only community managers can view donations.');
            } else {
                alert('Error fetching donations for your community.');
            }
        } catch (error) {
            console.error('Failed to fetch donations:', error);
            alert('An error occurred while fetching donations.');
        }
    }

    function displayDonations(donations) {
        const donationsTbody = document.getElementById('donationsTbody');
        donationsTbody.innerHTML = ''; // Clear previous data

        donations.forEach(donation => {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${donation.donation_id}</td>
                <td>${donation.item_name}</td>
                <td>${donation.item_type}</td>
                <td>${donation.value}</td>
                <td>${donation.quantity}</td>
                <td>${new Date(donation.donation_date).toLocaleDateString()}</td>
                <td>${donation.remaining_quantity}</td>
                <td>${donation.status}</td>
            `;

            donationsTbody.appendChild(row);
        });
    }
});


    const updateDonationForm = document.getElementById('updateDonationForm');
    const responseMessage = document.getElementById('responseMessage');

    updateDonationForm.addEventListener('submit', async function (e) {
        e.preventDefault(); // Prevent the default form submission

        // Get form data
        const donationId = document.getElementById('donationId').value;
        const status = document.getElementById('status').value;
        const quantityReceived = document.getElementById('quantityReceived').value;
        const quantityRemaining = document.getElementById('quantityRemaining').value;

        try {
            const response = await fetch(`http://localhost:8090/community/donations/${donationId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('token') // Assuming JWT is stored in localStorage
                },
                body: JSON.stringify({
                    status: status,
                    quantity_received: quantityReceived,
                    quantity_remaining: quantityRemaining
                })
            });

            if (response.ok) {
                const data = await response.json();
                responseMessage.textContent = data.message; // Display success message
            } else if (response.status === 403) {
                responseMessage.textContent = 'Access denied. Only community managers can update donation status.';
            } else if (response.status === 404) {
                responseMessage.textContent = 'Donation not found or does not belong to your community.';
            } else {
                responseMessage.textContent = 'Error updating donation status.';
            }
        } catch (error) {
            console.error('Error:', error);
            responseMessage.textContent = 'An error occurred while updating the donation status.';
        }
    });

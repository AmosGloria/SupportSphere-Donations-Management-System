document.addEventListener('DOMContentLoaded', () => {
    const createDonationForm = document.getElementById('createDonationForm');
    const responseMessage = document.getElementById('responseMessage');
    const donationTableBody = document.querySelector('#donationTable tbody');
    const messageDiv = document.getElementById('message');

    // Function to handle form submission for creating a donation
    createDonationForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent the default form submission

        const formData = {
            item_name: document.getElementById('item_name').value,
            item_type: document.getElementById('item_type').value,
            quantity: document.getElementById('quantity').value,
            value: document.getElementById('value').value,
            donation_date: document.getElementById('donation_date').value,
            community_name: document.getElementById('community_name').value
        };

        try {
            const response = await fetch('http://localhost:8090/donations/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}` // Assuming JWT is stored in localStorage
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                responseMessage.textContent = `Donation created successfully with ID: ${data.donationId}`;
                responseMessage.style.color = 'green';
                createDonationForm.reset(); // Clear the form
            } else {
                responseMessage.textContent = `Error: ${data.message}`;
                responseMessage.style.color = 'red';
            }
        } catch (error) {
            console.error('Error:', error);
            responseMessage.textContent = 'Failed to create donation';
            responseMessage.style.color = 'red';
        }
    });

    // Function to fetch donation history
    async function fetchDonations() {
        try {
            const response = await fetch('http://localhost:8090/donor/donations', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`, // Assuming you're using JWT stored in localStorage
                    'Content-Type': 'application/json'
                }
            });

            // Check if response is OK
            if (!response.ok) {
                throw new Error('Failed to fetch donation history');
            }

            const data = await response.json();

            // If there are donations, populate the table
            if (data.length > 0) {
                data.forEach(donation => {
                    const row = document.createElement('tr');

                    row.innerHTML = `
                        <td>${donation.donation_id}</td>
                        <td>${donation.item_name}</td>
                        <td>${donation.item_type}</td>
                        <td>${donation.quantity}</td>
                        <td>${donation.value}</td>
                        <td>${new Date(donation.donation_date).toLocaleDateString()}</td>
                        <td>${donation.status}</td>
                    `;

                    donationTableBody.appendChild(row);
                });
            } else {
                // Display message if no donations found
                messageDiv.style.display = 'block';
                messageDiv.innerText = 'No donation history found.';
            }
        } catch (error) {
            console.error('Error fetching donation history:', error);
            messageDiv.style.display = 'block';
            messageDiv.innerText = 'Failed to load donation history.';
        }
    }

    // Fetch donations when DOM is fully loaded
    fetchDonations(); // Call the async function without await at the top level
});

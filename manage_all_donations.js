document.addEventListener('DOMContentLoaded', () => {
    const createDonationForm = document.getElementById('createDonationForm');
    const responseMessage = document.getElementById('responseMessage');

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
                    'Authorization': `Bearer ${localStorage.getItem('token')}` //storing JWT in localStorage
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
});



    const donationTableBody = document.querySelector('#donationTable tbody');
    const errorMessage = document.getElementById('errorMessage');

    // Function to fetch all donations and populate the table
    async function fetchDonations() {
        try {
            const response = await fetch('http://localhost:8090/admin/donations', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}` // Assumes JWT is stored in localStorage
                }
            });
            const donations = await response.json();

            // Clear any existing rows
            donationTableBody.innerHTML = '';

            // Check if donations were fetched successfully
            if (response.ok) {
                donations.forEach((donation) => {
                    const row = document.createElement('tr');

                    row.innerHTML = `
                        <td>${donation.donation_id}</td>
                        <td>${donation.item_name}</td>
                        <td>${donation.item_type}</td>
                        <td>${donation.quantity}</td>
                        <td>${donation.value}</td>
                        <td>${donation.user_id}</td>
                        <td>${donation.community_id}</td>
                        <td>${donation.donation_date}</td>
                        <td>${donation.remaining_quantity}</td>
                        <td>${donation.status}</td>
                        <td>
                            <button class="deleteBtn" data-id="${donation.donation_id}">Delete</button>
                        </td>
                    `;

                    donationTableBody.appendChild(row);
                });

                // Add event listeners to each delete button
                const deleteButtons = document.querySelectorAll('.deleteBtn');
                deleteButtons.forEach(button => {
                    button.addEventListener('click', async (event) => {
                        const donationId = event.target.getAttribute('data-id');
                        deleteDonation(donationId);
                    });
                });
            } else {
                errorMessage.textContent = 'Failed to fetch donations.';
                errorMessage.style.color = 'red';
            }
        } catch (error) {
            console.error('Error fetching donations:', error);
            errorMessage.textContent = 'An error occurred while fetching donations.';
            errorMessage.style.color = 'red';
        }
    }

    // Function to delete a donation
    async function deleteDonation(donationId) {
        try {
            const response = await fetch(`http://localhost:8090/admin/donations/${donationId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message); // Show success message
                fetchDonations(); // Refresh the donation table
            } else {
                errorMessage.textContent = `Error: ${data.message}`;
                errorMessage.style.color = 'red';
            }
        } catch (error) {
            console.error('Error deleting donation:', error);
            errorMessage.textContent = 'Failed to delete donation.';
            errorMessage.style.color = 'red';
        }
    }

    // Fetch donations when the page loads
    fetchDonations();



        const updateDonationForm = document.getElementById('updateDonationForm');
        const responseMessage = document.getElementById('responseMessage');
    
        updateDonationForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent the default form submission behavior
    
            // Get the form values
            const donationId = document.getElementById('donationId').value;
            const status = document.getElementById('status').value;
            const quantityReceived = document.getElementById('quantity_received').value;
            const quantityRemaining = document.getElementById('quantity_remaining').value;
    
            const formData = {
                status: status,
                quantity_received: quantityReceived,
                quantity_remaining: quantityRemaining
            };
    
            try {
                const response = await fetch(`http://localhost:8090/admin/donations/${donationId}/status`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}` // Assumes JWT is stored in localStorage
                    },
                    body: JSON.stringify(formData)
                });
    
                const data = await response.json();
    
                if (response.ok) {
                    responseMessage.textContent = data.message;
                    responseMessage.style.color = 'green';
                    updateDonationForm.reset(); // Clear the form after successful update
                } else {
                    responseMessage.textContent = `Error: ${data.message}`;
                    responseMessage.style.color = 'red';
                }
            } catch (error) {
                console.error('Error:', error);
                responseMessage.textContent = 'Failed to update donation status';
                responseMessage.style.color = 'red';
            }
        });
    
    



document.getElementById('deleteDonationForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const donation_id = document.getElementById('donation_id').value;

    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`http://localhost:8090/donations/${donation_id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            document.getElementById('message').textContent = 'Donation deleted successfully!';
        } else {
            document.getElementById('message').textContent = 'Failed to delete donation.';
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('message').textContent = 'An error occurred. Please try again later.';
    }
});

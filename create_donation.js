document.getElementById('createDonationForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const item_name = document.getElementById('item_name').value;
    const item_type = document.getElementById('item_type').value;
    const value = document.getElementById('value').value;
    const quantity = document.getElementById('quantity').value;
    const community_id = document.getElementById('community_id').value;
    const donation_date = document.getElementById('donation_date').value;
    const remaining_quantity = document.getElementById('remaining_quantity').value;
    const status = document.getElementById('status').value;

    const token = localStorage.getItem('token');

    try {
        const response = await fetch('http://localhost:8090/donations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                item_name,
                item_type,
                value,
                quantity,
                community_id,
                donation_date,
                remaining_quantity,
                status
            })
        });

        if (response.ok) {
            document.getElementById('message').textContent = 'Donation created successfully!';
        } else {
            document.getElementById('message').textContent = 'Failed to create donation.';
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('message').textContent = 'An error occurred. Please try again later.';
    }
});

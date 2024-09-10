document.addEventListener('DOMContentLoaded', () => {
    const createDonationLink = document.getElementById('createDonationLink');
    const viewDonationsLink = document.getElementById('viewDonationsLink');
    const notificationsLink = document.getElementById('notificationsLink');
    const logoutBtn = document.getElementById('logoutBtn');

    // Sections
    const createDonationSection = document.getElementById('createDonation');
    const viewDonationsSection = document.getElementById('viewDonations');
    const notificationsSection = document.getElementById('notifications');

    // Form and Table Elements
    const createDonationForm = document.getElementById('createDonationForm');
    const donationsTableBody = document.getElementById('donationsTable').getElementsByTagName('tbody')[0];
    const notificationsList = document.getElementById('notificationsList');

    // Show and Hide Sections
    const showSection = (section) => {
        createDonationSection.style.display = 'none';
        viewDonationsSection.style.display = 'none';
        notificationsSection.style.display = 'none';
        section.style.display = 'block';
        scrollToSection(section); // Smooth scroll to the section
    };

    createDonationLink.addEventListener('click', () => showSection(createDonationSection));
    viewDonationsLink.addEventListener('click', () => showSection(viewDonationsSection));
    notificationsLink.addEventListener('click', () => showSection(notificationsSection));

    // Logout functionality
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'login.html';  // Handle logout logic here
    });

    // Submit Create Donation Form
    createDonationForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(createDonationForm);
        const donationData = {
            item_name: formData.get('item_name'),
            item_type: formData.get('item_type'),
            value: formData.get('value'),
            quantity: formData.get('quantity'),
            donation_date: formData.get('donation_date'),
            remaining_quantity: formData.get('remaining_quantity'),
            status: formData.get('status')
        };

        try {
            const response = await fetch('http://localhost:8090/donations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(donationData)
            });

            if (response.ok) {
                alert('Donation submitted successfully');
                createDonationForm.reset();
            } else {
                alert('Failed to submit donation');
            }
        } catch (error) {
            console.error('Error submitting donation:', error);
            alert('An error occurred');
        }
    });

    // Fetch and Display Donations
    const fetchDonations = async () => {
        try {
            const response = await fetch('http://localhost:8090/donations', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const donations = await response.json();
                donationsTableBody.innerHTML = '';

                donations.forEach(donation => {
                    const row = donationsTableBody.insertRow();
                    row.insertCell().textContent = donation.item_name;
                    row.insertCell().textContent = donation.item_type;
                    row.insertCell().textContent = donation.value;
                    row.insertCell().textContent = donation.quantity;
                    row.insertCell().textContent = donation.community_id || 'N/A'; // Handle optional community_id
                    row.insertCell().textContent = donation.donation_date;
                    row.insertCell().textContent = donation.remaining_quantity;
                    row.insertCell().textContent = donation.status;
                });
            } else {
                console.error('Failed to fetch donations');
            }
        } catch (error) {
            console.error('Error fetching donations:', error);
        }
    };

    fetchDonations();

    // Fetch and Display Notifications
    const fetchNotifications = async () => {
        try {
            const response = await fetch('http://localhost:8090/notifications', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const notifications = await response.json();
                notificationsList.innerHTML = '';

                notifications.forEach(notification => {
                    const listItem = document.createElement('li');
                    listItem.textContent = notification.message || 'No message';
                    notificationsList.appendChild(listItem);
                });
            } else {
                console.error('Failed to fetch notifications');
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    fetchNotifications();

    // Smooth Scroll Functionality for Button Clicks
    const scrollToSection = (element) => {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    };

    // Keyboard Navigation for Arrow Keys
    document.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowDown') {
            window.scrollBy({
                top: window.innerHeight, // Scroll down by the viewport height
                behavior: 'smooth'
            });
        } else if (event.key === 'ArrowUp') {
            window.scrollBy({
                top: -window.innerHeight, // Scroll up by the viewport height
                behavior: 'smooth'
            });
        }
    });
});

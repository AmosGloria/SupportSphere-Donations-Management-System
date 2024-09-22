// Logout button functionality
document.getElementById('logoutBtn').addEventListener('click', function() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
});

// Function to display the 'Create Donation' section
document.getElementById('createDonationLink').addEventListener('click', function() {
    hideAllSections();
    document.getElementById('createDonation').style.display = 'block';
});

// Function to display the 'View My Donations' section
document.getElementById('viewDonationsLink').addEventListener('click', function() {
    hideAllSections();
    document.getElementById('viewDonations').style.display = 'block';
    fetchMyDonations();
});

// Function to display the 'View Community Donations' section
document.getElementById('viewCommunityDonationsLink').addEventListener('click', function() {
    hideAllSections();
    document.getElementById('viewCommunityDonations').style.display = 'block';
    fetchCommunityDonations();  // Fetch and display community donations
});

// Function to display the 'Notifications' section
document.getElementById('notificationsLink').addEventListener('click', function() {
    hideAllSections();
    document.getElementById('notifications').style.display = 'block';
    fetchNotifications();
});

// Utility function to hide all sections
function hideAllSections() {
    document.getElementById('createDonation').style.display = 'none';
    document.getElementById('viewDonations').style.display = 'none';
    document.getElementById('viewCommunityDonations').style.display = 'none';
    document.getElementById('notifications').style.display = 'none';
}

// Fetch My Donations (for community manager's personal donations)
function fetchMyDonations() {
    const token = localStorage.getItem('token');
    
    fetch('/donations', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        const donationsTableBody = document.querySelector('#donationsTable tbody');
        donationsTableBody.innerHTML = ''; // Clear any existing data

        data.forEach(donation => {
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
            donationsTableBody.appendChild(row);
        });
    })
    .catch(error => {
        console.error('Error fetching donations:', error);
    });
}

// Fetch Donations Directed to Community
function fetchCommunityDonations() {
    const token = localStorage.getItem('token');

    fetch('/donations/community', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        const communityDonationsTableBody = document.querySelector('#communityDonationsTable tbody');
        communityDonationsTableBody.innerHTML = ''; // Clear any existing data

        data.forEach(donation => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${donation.item_name}</td>
                <td>${donation.item_type}</td>
                <td>${donation.value}</td>
                <td>${donation.quantity}</td>
                <td>${donation.donation_date}</td>
                <td>${donation.remaining_quantity}</td>
                <td>${donation.status}</td>
            `;
            communityDonationsTableBody.appendChild(row);
        });
    })
    .catch(error => {
        console.error('Error fetching community donations:', error);
    });
}

// Fetch notifications (you may already have this functionality implemented)
function fetchNotifications() {
    const token = localStorage.getItem('token');
    
    fetch('/notifications', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        const notificationsList = document.getElementById('notificationsList');
        notificationsList.innerHTML = ''; // Clear any existing data

        data.forEach(notification => {
            const listItem = document.createElement('li');
            listItem.textContent = notification.message;
            notificationsList.appendChild(listItem);
        });
    })
    .catch(error => {
        console.error('Error fetching notifications:', error);
    });
}

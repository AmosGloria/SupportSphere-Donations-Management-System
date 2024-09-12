-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS SupportSphere_db;
USE SupportSphere_db;

-- Create or update the Users table
CREATE TABLE IF NOT EXISTS Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'donor', 'community_manager') NOT NULL
);

-- Create or update the Communities table
CREATE TABLE IF NOT EXISTS Communities (
    community_id INT AUTO_INCREMENT PRIMARY KEY,
    community_name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    community_manager_id INT,
    FOREIGN KEY (community_manager_id) REFERENCES Users(user_id)
);

-- Create or update the CommunityManagers table
CREATE TABLE IF NOT EXISTS CommunityManagers (
    community_manager_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    community_id INT,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (community_id) REFERENCES Communities(community_id)
);

-- Create or update the Donations table
CREATE TABLE IF NOT EXISTS Donations (
    donation_id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    item_type ENUM('monetary', 'in-kind') NOT NULL,
    value DECIMAL(10, 2),
    quantity INT,
    user_id INT,
    community_id INT,
    donation_date DATE NOT NULL,
    remaining_quantity INT,
    status ENUM('pending', 'received', 'not_received') NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (community_id) REFERENCES Communities(community_id)
);

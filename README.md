# ACIT3495_Group17

## Deployment Instructions:
-
-
-


## Architecture Diagram
<img width="856" height="577" alt="image" src="https://github.com/user-attachments/assets/314ae71a-1b9e-416c-8104-2d73f103c714" />




## Data Collection and Analytics System Breakdown

**Enter Data (Web App)**
- Users enter numeric data
- Stores data in MySQL

**Authentication Service**
- Validates users

**Show Results (Web App)**
- View analytics stored in MongoDB

**MongoDB**
- Stores analytics

**Analytics Service**
- Reads data from MySQL
- Calculates analytics -> stores in MongoDB

**MySql DB**
- Stores raw data

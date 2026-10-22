# ACIT3495_Group17

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

## Architecture Diagram
<img width="856" height="577" alt="image" src="https://github.com/user-attachments/assets/314ae71a-1b9e-416c-8104-2d73f103c714" />

# Deployment Instructions

---

## 1. Prerequisites
* Docker installed
* Clone the Repo:
```bash
git clone [<repo-url>](https://github.com/HsuSteven/ACIT3495_Group17.git)
cd ACIT3495_Group17
```
---

## 2. Environment Configuration
Create a `.env` file in the project root directory alongside `compose.yaml`:

```env
SESSION_SECRET=my_super_secret_session_key_12345
MYSQL_PASSWORD=acit3495
MONGO_INITDB_ROOT_PASSWORD=acit3495
```
## 3. Use App
Launch:
```bash
docker compose up --build -d
```
Inspect Logs:
```bash
docker compose logs -f analytics
```
Teardown (Keep volumes):
```bash
docker compose down
```

Teardown (Remove volumes):
```bash
docker compose down -v
```


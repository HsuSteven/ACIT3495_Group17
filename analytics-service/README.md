# Analytics Service & Database Setup
---
## Parts

* **`mysql`**: Runs internally on port `3306`. It runs `mysql/init.sql` on startup to make the `db` database and create the `grades` table with sample data.
* **`analytics`**: Python script (`analytics.py`) that checks MySQL every 5 seconds, calculates `min`, `max`, `avg`, and `count` for each course, and upserts the result into MongoDB.
* **`mongo`**: Runs internally on port `27017`. It stores the aggregated stats inside the `grade_analytics` collection for the Show Results app to display.

---

How to run only these services (since others not finished yet)
```bash
docker compose up --build -d mysql mongo analytics
```

Check to ensure data is in there
```bash
docker compose logs -f analytics
```



const { MongoClient } = require("mongodb");

// One shared client: it connects on first use and reconnects as needed
function createStore(uri) {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 2000 });
  const db = client.db(process.env.MONGO_DATABASE || "analyticsdb");
  const collection = db.collection(process.env.MONGO_COLLECTION || "grade_analytics");

  return {
    fetchMongoData: () =>
      collection.find({}, { projection: { _id: 0 } }).sort({ course_code: 1 }).toArray(),
    ping: () => db.command({ ping: 1 }),
    close: () => client.close(),
  };
}

module.exports = { createStore };

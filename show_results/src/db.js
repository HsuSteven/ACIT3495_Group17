import { MongoClient } from "mongodb";

const uri = "mongodb://bcit:acit3495@mongo:27017/db?authSource=admin";
const client = new MongoClient(uri);

async function fetchMongoData() {
  try {
    // Connect to the MongoDB cluster
    await client.connect();
    console.log("Successfully connected to MongoDB!");

    // Specify the database you want to use
    const db = client.db("analyticsdb");
    const collection = db.collection("grade_analytics");
    const query = {};
    const cursor = collection.find(query);
    const documents = await cursor.toArray();
    return documents;
  } catch (error) {
    console.error("There was an error fetching data from mongoDB", error);
  } finally {
    await client.close();
  }
}

export { fetchMongoData };

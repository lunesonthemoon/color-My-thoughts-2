// YOUR MIND - LOCAL BACKEND

// MOODBOARD BACKEND

const express = require("express");
const { MongoClient } = require("mongodb");
const path = require("path");

const app = express();
const PORT = 3000;

// MongoDB configuration

const MONGO_URI =
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017";

const DATABASE_NAME = "Coloryourmind2";
const COLLECTION_NAME = "entries";

// Allowed colours

const ALLOWED_COLORS = [
    "#f75151",
    "#ffa154",
    "#ffeb8b",
    "#9adca0",
    "#585eb2",
    "#b072c7",
    "#ffa2da",
    "#4c4848",
    "#e6e6e6"
];

// Middleware


//console.log(path.join(__dirname, "public"))

app.use(express.static("frontend"));


app.use(express.json({ limit: "100kb" }));

// app.get("/", (req, res) => {
//     res.sendFile(path.join(__dirname, "public", "index.html")); 
// })

let entriesCollection;
let mongoClient;

// Connect to MongoDB

async function connectDatabase() {

    mongoClient = new MongoClient(MONGO_URI);

    await mongoClient.connect();

    console.log("MongoDB connection established.");

    const database = mongoClient.db(DATABASE_NAME);

    console.log("DATABASE BEING USED:", database.databaseName);

    // Check existing collections without creating an index

    const collections = await database
        .listCollections()
        .toArray();

    console.log(
        "EXISTING COLLECTIONS:",
        collections.map(c => c.name)
    );

    entriesCollection = database.collection(COLLECTION_NAME);

    console.log("Connected to MongoDB successfully!");
    console.log("Database:", DATABASE_NAME);
    console.log("Collection:", COLLECTION_NAME);

}

// Validate visitor ID

function validVisitorId(visitorId) {

    return (
        typeof visitorId === "string" &&
        visitorId.length <= 100 &&
        /^[a-zA-Z0-9-]+$/.test(visitorId)
    );

}

// POST: Save an entry

app.post("/api/entries", async (req, res) => {

    try {

        const { visitorId, colors, note = "" } = req.body;

        // Validate visitor ID

        if (!validVisitorId(visitorId)) {

            return res.status(400).json({
                message: "Invalid visitor ID."
            });

        }

        // Validate selected colours

        if (
            !Array.isArray(colors) ||
            colors.length === 0 ||
            colors.some(color => !ALLOWED_COLORS.includes(color)) ||
            new Set(colors).size !== colors.length
        ) {

            return res.status(400).json({
                message: "Please select at least one valid colour."
            });

        }

        // Validate written reflection

        if (
            typeof note !== "string" ||
            note.length > 2000
        ) {

            return res.status(400).json({
                message: "Your note must be 2000 characters or fewer."
            });

        }

        // Create new entry

        const newEntry = {

            visitorId: visitorId,

            colors: colors,

            note: note.trim(),

            createdAt: new Date()

        };

        // Save entry to MongoDB

        const result = await entriesCollection.insertOne(newEntry);

        res.status(201).json({

            message: "Entry saved successfully!",

            id: result.insertedId

        });

    } catch (error) {

        console.error("Save error:", error);

        res.status(500).json({

            message: "Unable to save your entry."

        });

    }

});

// GET: Retrieve saved entries

app.get("/api/entries", async (req, res) => {

    try {

        const visitorId = req.query.visitorId;

        // Validate visitor ID

        if (!validVisitorId(visitorId)) {

            return res.status(400).json({

                message: "Invalid visitor ID."

            });

        }

        // Retrieve entries belonging to this visitor

        const entries = await entriesCollection
            .find({ visitorId: visitorId })
            .sort({ createdAt: -1 })
            .limit(100)
            .toArray();

        res.status(200).json({

            entries: entries

        });

    } catch (error) {

        console.error("Retrieval error:", error);

        res.status(500).json({

            message: "Unable to retrieve entries."

        });

    }

});

// Handle invalid API requests

app.use("/api", (req, res) => {

    res.status(404).json({

        message: "API endpoint not found."

    });

});

// Start server

async function startServer() {

    try {

        await connectDatabase();

        app.listen(PORT, () => {

            console.log(
                `Color Your Mind is running at http://localhost:${PORT}`
            );

        });

    } catch (error) {

        console.error("Server startup failed:", error);

        if (mongoClient) {

            await mongoClient.close();

        }

        process.exit(1);

    }

}

startServer();
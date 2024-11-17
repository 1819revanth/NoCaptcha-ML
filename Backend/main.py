from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from pymongo import MongoClient, errors
from typing import Optional, List
import logging
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Initialize FastAPI app
app = FastAPI()

# Load origins from .env and parse them as a list
origins = os.getenv("ORIGINS", "").split(",")
if not origins:
    logging.error("No origins specified in the .env file.")
    raise HTTPException(status_code=500, detail="CORS origins missing")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Use the origins from the .env file
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection setup using .env variables
MONGO_URI = os.getenv("MONGO_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME")
COLLECTION_NAME = os.getenv("COLLECTION_NAME")

if not all([MONGO_URI, DATABASE_NAME, COLLECTION_NAME]):
    logging.error("Environment variables are not set correctly.")
    raise HTTPException(status_code=500, detail="Environment variables missing")

try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    db = client[DATABASE_NAME]
    collection = db[COLLECTION_NAME]
    logging.info("Connected to MongoDB successfully.")
except errors.ConnectionFailure as e:
    logging.error(f"Could not connect to MongoDB: {e}")
    raise HTTPException(status_code=500, detail="Database connection failed")

# Define the interaction data schema
class InteractionData(BaseModel):
    Mouse_Path_Length: float
    Mouse_Avg_Speed: float
    Mouse_Max_Speed: float
    Mouse_Stops: int
    Mouse_Click_Frequency: float
    Mouse_Scroll_Speed: float
    Mouse_Scroll_Direction_Changes: int
    Avg_Click_X: float
    Avg_Click_Y: float
    Click_Spread: float
    Typing_Speed: float
    Keypress_Interval_Avg: float
    Key_Hold_Duration_Avg: float
    Special_Key_Usage: int
    Error_Corrections: int
    Pause_Between_Typing: float
    Interaction_Duration: float
    Mouse_Keyboard_Interaction_Correlation: float
    Response_Time: float


@app.post("/api/interaction")
async def receive_interaction(data: InteractionData):
    try:
        # Insert the interaction data into MongoDB
        result = collection.insert_one(data.dict())
        if not result.acknowledged:
            raise Exception("Failed to acknowledge MongoDB insertion.")
        return {"message": "Data stored successfully", "id": str(result.inserted_id)}
    except errors.PyMongoError as e:
        logging.error(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Failed to store data in the database")
    except Exception as e:
        logging.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")

# Test endpoint
@app.get("/api/interaction/test")
async def test_endpoint():
    try:
        # Test MongoDB connection
        client.admin.command("ping")
        return {"message": "MongoDB connection is active"}
    except errors.ConnectionFailure as e:
        logging.error(f"MongoDB connection test failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to connect to MongoDB")

PORT = int(os.getenv("PORT", 8000))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
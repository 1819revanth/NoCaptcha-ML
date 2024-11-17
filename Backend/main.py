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
    Mouse_Path_Length: float = Field(..., example=120.5)
    Mouse_Avg_Speed: float = Field(..., example=150.0)
    Mouse_Max_Speed: float = Field(..., example=200.0)
    Mouse_Stops: int = Field(..., example=5)
    Mouse_Click_Frequency: float = Field(..., example=2.0)
    Mouse_Scroll_Speed: float = Field(..., example=30.0)
    Mouse_Scroll_Direction_Changes: int = Field(..., example=3)
    Avg_Click_X: float = Field(..., example=250.0)
    Avg_Click_Y: float = Field(..., example=300.0)
    Click_Spread: float = Field(..., example=50.0)
    Typing_Speed: float = Field(..., example=10.0)
    Keypress_Interval_Avg: float = Field(..., example=100.0)
    Key_Hold_Duration_Avg: float = Field(..., example=120.0)
    Special_Key_Usage: int = Field(..., example=5)
    Error_Corrections: int = Field(..., example=2)
    Pause_Between_Typing: float = Field(..., example=500.0)
    Interaction_Duration: float = Field(..., example=3.0)
    Mouse_Keyboard_Interaction_Correlation: float = Field(..., example=0.8)
    Response_Time: float = Field(..., example=1.5)

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
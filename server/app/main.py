from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import scanner  # Import your router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(scanner.router)  # Include the router

@app.get("/")
def read_root():
    return {"test": "did it change?"} # Change this text
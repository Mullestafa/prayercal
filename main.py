import os
import uvicorn
from dotenv import load_dotenv

from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.responses import HTMLResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from parser import PrayerTimesParser
from calendar_generator import CalendarGenerator
from models import MonthlyPrayerSchedule

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Prayer Times Parser",
    description="Upload prayer timetable images and get calendar files",
    version="1.0.0"
)

# Initialize services
parser = PrayerTimesParser()
calendar_generator = CalendarGenerator()

# Setup templates
templates = Jinja2Templates(directory="templates")

# Create static directory if it doesn't exist
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Home page with upload form."""
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/upload")
async def upload_prayer_timetable(file: UploadFile = File(...)):
    """Upload and parse prayer timetable image."""
    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Please upload an image file")
    
    try:
        # Read file contents
        contents = await file.read()
        
        # Parse prayer timetable
        prayer_schedule = await parser.parse_prayer_timetable(contents)
        
        # Return the parsed data and download link
        return {
            "message": "Prayer timetable parsed successfully",
            "parsed_data": prayer_schedule.model_dump(),
            "calendar_ready": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@app.post("/download-calendar")
async def download_calendar(prayer_schedule_data: dict):
    """Generate and download calendar file."""
    try:
        # Convert dict back to Pydantic model
        prayer_schedule = MonthlyPrayerSchedule(**prayer_schedule_data)
        
        # Generate calendar
        ical_content = calendar_generator.create_ical_calendar(prayer_schedule)
        
        # Create filename
        filename = f"prayer_times_{prayer_schedule.city}_{prayer_schedule.month}_{prayer_schedule.year}.ics"
        
        # Return calendar file
        return Response(
            content=ical_content,
            media_type="text/calendar",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating calendar: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "Prayer Times Parser"}

if __name__ == "__main__":
    # Check for required environment variables
    if not os.getenv("MISTRAL_API_KEY"):
        print("Warning: MISTRAL_API_KEY environment variable not set")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)

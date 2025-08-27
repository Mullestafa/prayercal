# Prayer Times Parser

A production-ready FastAPI application that uses Mistral AI to parse prayer timetable images and generate calendar files.

## Features

- 🖼️ Upload prayer timetable images
- 🤖 AI-powered parsing with Mistral Document AI
- 📅 Generate iCalendar (.ics) files
- 🌐 Modern web interface
- 🔔 Prayer time reminders
- 📱 Mobile-friendly design

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Set Environment Variables

Create a `.env` file:

```bash
MISTRAL_API_KEY=your_mistral_api_key_here
```

### 3. Run the Application

```bash
python main.py
```

The application will be available at `http://localhost:8000`

## API Endpoints

- `GET /` - Web interface
- `POST /upload` - Upload and parse prayer timetable image
- `POST /download-calendar` - Generate and download calendar file
- `GET /health` - Health check

## Usage

1. Open the web interface
2. Upload an image of a prayer timetable
3. Wait for AI processing
4. Download the generated calendar file
5. Import the calendar into your preferred calendar app

## Supported Formats

- Input: JPG, PNG, and other common image formats
- Output: iCalendar (.ics) format compatible with Google Calendar, Apple Calendar, Outlook, etc.

## Model Schema

The application uses the following Pydantic models for structured data extraction:

```python
class PrayerTimes(BaseModel):
    subh: time  # Fajr prayer
    sunrise: time
    dhuhr: time
    sunset: time
    maghrib: time
    midnight: time

class DailyPrayerSchedule(BaseModel):
    weekday: str
    date: int
    prayers: PrayerTimes

class MonthlyPrayerSchedule(BaseModel):
    month: str
    year: int
    city: str
    schedule: List[DailyPrayerSchedule]
```

## Production Deployment

### Using Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Variables for Production

- `MISTRAL_API_KEY` - Your Mistral AI API key (required)
- `PORT` - Port to run the application (default: 8000)

## License

MIT License

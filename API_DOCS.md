# Prayer Times Parser API Documentation

## Overview

The Prayer Times Parser is a production-ready FastAPI application that uses Mistral AI to extract prayer timetables from images and generate calendar files.

## Quick Start

1. **Install Dependencies**
   ```bash
   ./setup.sh
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env and add your MISTRAL_API_KEY
   ```

3. **Run the Application**
   ```bash
   ./start.sh
   ```

4. **Access the Web Interface**
   - Open http://localhost:8000 in your browser
   - Upload a prayer timetable image
   - Download the generated calendar file

## API Endpoints

### GET /
Returns the web interface for uploading prayer timetable images.

**Response**: HTML page with upload form

### POST /upload
Upload and parse a prayer timetable image.

**Request**:
- `file`: Image file (multipart/form-data)

**Response**:
```json
{
  "message": "Prayer timetable parsed successfully",
  "parsed_data": {
    "month": "August",
    "year": 2025,
    "city": "København",
    "schedule": [
      {
        "weekday": "fredag",
        "date": 1,
        "prayers": {
          "subh": "04:30",
          "sunrise": "06:15",
          "dhuhr": "13:25",
          "sunset": "20:35",
          "maghrib": "20:40",
          "midnight": "01:15"
        }
      }
    ]
  },
  "calendar_ready": true
}
```

### POST /download-calendar
Generate and download a calendar file from parsed prayer data.

**Request**:
```json
{
  "month": "August",
  "year": 2025,
  "city": "København",
  "schedule": [...]
}
```

**Response**: iCalendar (.ics) file download

### GET /health
Health check endpoint.

**Response**:
```json
{
  "status": "healthy",
  "service": "Prayer Times Parser"
}
```

## Data Models

### PrayerTimes
```python
{
  "subh": "04:30",      # Fajr prayer time
  "sunrise": "06:15",   # Sunrise time
  "dhuhr": "13:25",     # Dhuhr prayer time
  "sunset": "20:35",    # Sunset time
  "maghrib": "20:40",   # Maghrib prayer time
  "midnight": "01:15"   # Midnight prayer time
}
```

### DailyPrayerSchedule
```python
{
  "weekday": "fredag",  # Day name
  "date": 1,            # Day of month
  "prayers": {PrayerTimes}
}
```

### MonthlyPrayerSchedule
```python
{
  "month": "August",    # Month name
  "year": 2025,         # Year
  "city": "København",  # City name
  "schedule": [DailyPrayerSchedule]
}
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MISTRAL_API_KEY` | Yes | Your Mistral AI API key |
| `PORT` | No | Server port (default: 8000) |
| `WORKERS` | No | Number of worker processes (default: 1) |

## Deployment

### Docker
```bash
docker build -t prayer-times-parser .
docker run -p 8000:8000 -e MISTRAL_API_KEY=your_key prayer-times-parser
```

### Production Server
```bash
# Using the provided start script
./start.sh

# Or manually with uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1
```

## Supported Image Formats

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- BMP (.bmp)
- TIFF (.tiff)

## Calendar Features

The generated iCalendar (.ics) files include:

- ✅ All prayer times as separate events
- ⏰ 15-minute reminder alarms
- 📍 Location information
- 🏷️ Event categories (Prayer, Islamic)
- 📱 Compatible with Google Calendar, Apple Calendar, Outlook

## Error Handling

- **400**: Invalid file format or missing file
- **422**: Failed to parse AI response
- **500**: Server error or missing API key

## Security Notes

- File size limited to 10MB
- Only image files accepted
- No file persistence on server
- Environment variables for sensitive data

## Troubleshooting

### Common Issues

1. **"API key not provided"**
   - Ensure MISTRAL_API_KEY is set in .env file
   - Restart the application after setting the key

2. **"Failed to parse AI response"**
   - Check that the uploaded image contains a clear prayer timetable
   - Ensure the timetable has readable text and times

3. **Import errors during development**
   - Activate the virtual environment: `source .venv/bin/activate`
   - Ensure all dependencies are installed: `pip install -r requirements.txt`

### Logs
The application logs requests and errors to stdout. For production, redirect to a log file:

```bash
./start.sh > prayer_parser.log 2>&1
```

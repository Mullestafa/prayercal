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

# System deps (gcc for compiled wheels) and curl for healthcheck
RUN apt-get update && apt-get install -y \
    gcc curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8010

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8010/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8010", "--workers", "1"]
```

#### Build & Run (Keeps Running Unless Stopped)

```bash
# Build the image
docker build -t prayercal .

# Run detached, auto-restart unless manually stopped
docker run -d \
    --name prayercal \
    --restart unless-stopped \
    -p 8010:8010 \
    -e MISTRAL_API_KEY=your_mistral_api_key_here \
    prayercal
```

Access the app at: http://localhost:8010

Check status / logs:
```bash
docker ps
docker logs -f prayercal
```

Stop / start later:
```bash
docker stop prayercal
docker start prayercal
```

#### Optional docker-compose

Create a `docker-compose.yml`:
```yaml
services:
    prayercal:
        build: .
        image: prayercal
        ports:
            - "8010:8010"
        environment:
            MISTRAL_API_KEY: ${MISTRAL_API_KEY}
        restart: unless-stopped
```

Then run:
```bash
docker compose up -d --build
```

Note: Running `python main.py` locally serves on port 8000; the Docker image uses 8010. Change the port by editing the `CMD` line if needed.
### Environment Variables for Production

- `MISTRAL_API_KEY` - Your Mistral AI API key (required)

## License

MIT License

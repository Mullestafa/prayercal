from typing import List
from pydantic import BaseModel, Field
from datetime import time, datetime

class PrayerTimes(BaseModel):
    subh: time = Field(..., description="Time for Subh (Fajr) prayer")
    sunrise: time = Field(..., description="Time for sunrise")
    dhuhr: time = Field(..., description="Time for Dhuhr prayer")
    sunset: time = Field(..., description="Time for sunset")
    maghrib: time = Field(..., description="Time for Maghrib prayer")
    midnight: time = Field(..., description="Time for Midnight prayer")

class DailyPrayerSchedule(BaseModel):
    weekday: str = Field(..., description="Name of the weekday, e.g., fredag")
    date: int = Field(..., description="Day of the month")
    prayers: PrayerTimes

class MonthlyPrayerSchedule(BaseModel):
    month: str = Field(
        default_factory=lambda: datetime.now().strftime("%B"),
        description="Month name, e.g., 'August'"
    )
    year: int = Field(
        default_factory=lambda: datetime.now().year,
        description="Year, e.g., 2025"
    )
    city: str = Field(..., description="City for which timetable applies")
    schedule: List[DailyPrayerSchedule]

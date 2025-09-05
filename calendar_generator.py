from datetime import datetime, timedelta
from icalendar import Calendar, Event
from models import MonthlyPrayerSchedule
import calendar

class CalendarGenerator:
    def __init__(self):
        pass
    
    def create_ical_calendar(self, prayer_schedule: MonthlyPrayerSchedule) -> str:
        """Generate an iCalendar file from prayer schedule."""
        cal = Calendar()
        cal.add('prodid', '-//Prayer Times Calendar//prayercal//EN')
        cal.add('version', '2.0')
        cal.add('calscale', 'GREGORIAN')
        cal.add('method', 'PUBLISH')
        cal.add('x-wr-calname', f'Prayer Times - {prayer_schedule.city} {prayer_schedule.month} {prayer_schedule.year}')
        cal.add('x-wr-caldesc', f'Prayer times for {prayer_schedule.city}')
        
        # Get month number from month name
        month_num = self._get_month_number(prayer_schedule.month)
        
        for day_schedule in prayer_schedule.schedule:
            date_obj = datetime(prayer_schedule.year, month_num, day_schedule.date)
            
            # Add events for each prayer
            prayers = [
                ('Subh (Fajr)', day_schedule.prayers.subh),
                ('Sunrise', day_schedule.prayers.sunrise),
                ('Dhuhr', day_schedule.prayers.dhuhr),
                ('Sunset', day_schedule.prayers.sunset),
                ('Maghrib', day_schedule.prayers.maghrib),
                ('Midnight', day_schedule.prayers.midnight)
            ]
            
            for prayer_name, prayer_time in prayers:
                event = Event()
                
                # Combine date and time
                prayer_datetime = datetime.combine(date_obj.date(), prayer_time)
                
                event.add('summary', f'{prayer_name}')
                event.add('dtstart', prayer_datetime)
                event.add('dtend', prayer_datetime + timedelta(minutes=30))
                event.add('description', f'{prayer_name} prayer time for {prayer_schedule.city}')
                event.add('location', prayer_schedule.city)
                event.add('categories', 'Prayer,Islamic')
                
                # Add required properties per RFC 5545
                event.add('dtstamp', datetime.now())
                event.add('uid', f'{prayer_name.lower().replace(" ", "-")}-{date_obj.strftime("%Y%m%d")}-{prayer_schedule.city.lower().replace(" ", "-")}@prayercal')
                
                # Add alarm 15 minutes before
                from icalendar import Alarm
                alarm = Alarm()
                alarm.add('action', 'DISPLAY')
                alarm.add('description', f'Reminder: {prayer_name} Prayer')
                alarm.add('trigger', timedelta(minutes=-15))
                event.add_component(alarm)
                
                cal.add_component(event)
        
        return cal.to_ical().decode('utf-8')
    
    def _get_month_number(self, month_name: str) -> int:
        """Convert month name to month number."""
        month_names = {
            'january': 1, 'february': 2, 'march': 3, 'april': 4,
            'may': 5, 'june': 6, 'july': 7, 'august': 8,
            'september': 9, 'october': 10, 'november': 11, 'december': 12,
            'januar': 1, 'februar': 2, 'marts': 3, 
            'maj': 5, 'juni': 6, 'juli': 7, 
            'oktober': 10
        }
        
        month_lower = month_name.lower()
        if month_lower in month_names:
            return month_names[month_lower]
        
        # Try to get month by matching the first few characters
        for name, num in month_names.items():
            if name.startswith(month_lower[:3]):
                return num
        
        # Fallback: try using calendar module
        try:
            for i in range(1, 13):
                if calendar.month_name[i].lower().startswith(month_lower[:3]):
                    return i
        except Exception:
            pass
        
        # Default to current month if can't parse
        return datetime.now().month

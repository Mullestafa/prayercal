from typing import List, Dict, Any
from datetime import datetime, time, timedelta
import calendar
from models import MonthlyPrayerSchedule, DailyPrayerSchedule

class PrayerTimesSanityChecker:
    """Performs sanity checks on parsed prayer times data."""
    
    def __init__(self):
        self.issues = []
        self.warnings = []
    
    def check_schedule(self, schedule: MonthlyPrayerSchedule) -> Dict[str, Any]:
        """
        Perform comprehensive sanity checks on a prayer schedule.
        
        Returns:
            Dict containing check results and any issues found
        """
        self.issues = []
        self.warnings = []
        
        # Basic validation checks
        self._check_date_completeness(schedule)
        self._check_date_sequence(schedule)
        self._check_prayer_time_order(schedule)
        self._check_time_jumps(schedule)
        self._check_reasonable_times(schedule)
        self._check_seasonal_consistency(schedule)
        
        return {
            "is_valid": len(self.issues) == 0,
            "issues": self.issues,
            "warnings": self.warnings,
            "total_days": len(schedule.schedule),
            "month": schedule.month,
            "year": schedule.year,
            "city": schedule.city
        }
    
    def _check_date_completeness(self, schedule: MonthlyPrayerSchedule):
        """Check if all days of the month are present."""
        try:
            # Get the number of days in the month
            month_num = datetime.strptime(schedule.month, "%B").month
            days_in_month = calendar.monthrange(schedule.year, month_num)[1]
            
            present_dates = {day.date for day in schedule.schedule}
            expected_dates = set(range(1, days_in_month + 1))
            
            missing_dates = expected_dates - present_dates
            extra_dates = present_dates - expected_dates
            
            if missing_dates:
                self.issues.append(f"Missing dates: {sorted(missing_dates)}")
            
            if extra_dates:
                self.issues.append(f"Extra/invalid dates: {sorted(extra_dates)}")
                
        except ValueError as e:
            self.issues.append(f"Invalid month name '{schedule.month}': {e}")
    
    def _check_date_sequence(self, schedule: MonthlyPrayerSchedule):
        """Check if dates are in proper sequence."""
        dates = [day.date for day in schedule.schedule]
        
        # Check for duplicates
        if len(dates) != len(set(dates)):
            duplicates = [date for date in set(dates) if dates.count(date) > 1]
            self.issues.append(f"Duplicate dates found: {duplicates}")
        
        # Check if dates are sorted
        if dates != sorted(dates):
            self.warnings.append("Dates are not in sequential order")
    
    def _check_prayer_time_order(self, schedule: MonthlyPrayerSchedule):
        """Check if prayer times are in correct order within each day."""
        for day in schedule.schedule:
            times = [
                ("subh", day.prayers.subh),
                ("sunrise", day.prayers.sunrise),
                ("dhuhr", day.prayers.dhuhr),
                ("sunset", day.prayers.sunset),
                ("maghrib", day.prayers.maghrib),
                ("midnight", day.prayers.midnight)
            ]
            
            # Check basic order (excluding midnight which wraps around)
            daily_times = times[:-1]  # Exclude midnight for basic check
            for i in range(len(daily_times) - 1):
                current_name, current_time = daily_times[i]
                next_name, next_time = daily_times[i + 1]
                
                if current_time >= next_time:
                    self.issues.append(
                        f"Date {day.date}: {current_name} ({current_time}) should be before {next_name} ({next_time})"
                    )
            
            # Special check for midnight (should be after maghrib but could be next day)
            if day.prayers.maghrib > day.prayers.midnight:
                # This is expected - midnight is next day
                pass
            else:
                # Midnight should be after maghrib on same day or early next day
                midnight_minutes = day.prayers.midnight.hour * 60 + day.prayers.midnight.minute
                if midnight_minutes > 6 * 60:  # After 6 AM is suspicious for midnight prayer
                    self.warnings.append(f"Date {day.date}: Midnight time ({day.prayers.midnight}) seems unusual")
    
    def _check_time_jumps(self, schedule: MonthlyPrayerSchedule):
        """Check for unexpectedly large jumps in prayer times between consecutive days."""
        if len(schedule.schedule) < 2:
            return
        
        # Sort by date to ensure proper sequence
        sorted_schedule = sorted(schedule.schedule, key=lambda x: x.date)
        
        for i in range(len(sorted_schedule) - 1):
            current_day = sorted_schedule[i]
            next_day = sorted_schedule[i + 1]
            
            # Only check consecutive dates
            if next_day.date != current_day.date + 1:
                continue
            
            # Check each prayer time for large jumps
            prayer_pairs = [
                ("subh", current_day.prayers.subh, next_day.prayers.subh),
                ("sunrise", current_day.prayers.sunrise, next_day.prayers.sunrise),
                ("dhuhr", current_day.prayers.dhuhr, next_day.prayers.dhuhr),
                ("sunset", current_day.prayers.sunset, next_day.prayers.sunset),
                ("maghrib", current_day.prayers.maghrib, next_day.prayers.maghrib),
                ("midnight", current_day.prayers.midnight, next_day.prayers.midnight)
            ]
            
            for prayer_name, time1, time2 in prayer_pairs:
                diff_minutes = self._time_difference_minutes(time1, time2)
                
                # Define thresholds for different prayers (in minutes)
                thresholds = {
                    "subh": 10,      # Fajr changes gradually
                    "sunrise": 10,   # Sunrise changes gradually  
                    "dhuhr": 5,      # Noon is quite stable
                    "sunset": 10,    # Sunset changes gradually
                    "maghrib": 10,   # Maghrib follows sunset
                    "midnight": 15   # Can vary more
                }
                
                if abs(diff_minutes) > thresholds.get(prayer_name, 10):
                    self.warnings.append(
                        f"Large time jump in {prayer_name} between dates {current_day.date} and {next_day.date}: "
                        f"{time1} -> {time2} ({diff_minutes:+.1f} minutes)"
                    )
    
    def _check_reasonable_times(self, schedule: MonthlyPrayerSchedule):
        """Check if prayer times fall within reasonable ranges."""
        for day in schedule.schedule:
            # Define reasonable ranges for each prayer (24-hour format)
            ranges = {
                "subh": (time(3, 0), time(7, 0)),      # 3 AM - 7 AM
                "sunrise": (time(4, 0), time(8, 0)),   # 4 AM - 8 AM
                "dhuhr": (time(11, 0), time(15, 0)),   # 11 AM - 3 PM
                "sunset": (time(16, 0), time(21, 0)),  # 4 PM - 9 PM
                "maghrib": (time(16, 0), time(21, 30)), # 4 PM - 9:30 PM
                "midnight": (time(21, 0), time(6, 0))   # 9 PM - 6 AM (next day)
            }
            
            prayers = {
                "subh": day.prayers.subh,
                "sunrise": day.prayers.sunrise,
                "dhuhr": day.prayers.dhuhr,
                "sunset": day.prayers.sunset,
                "maghrib": day.prayers.maghrib,
                "midnight": day.prayers.midnight
            }
            
            for prayer_name, prayer_time in prayers.items():
                min_time, max_time = ranges[prayer_name]
                
                # Special handling for midnight (can wrap around to next day)
                if prayer_name == "midnight":
                    if not (prayer_time >= min_time or prayer_time <= max_time):
                        self.warnings.append(
                            f"Date {day.date}: {prayer_name} time ({prayer_time}) outside reasonable range "
                            f"({min_time} - {max_time})"
                        )
                else:
                    if not (min_time <= prayer_time <= max_time):
                        self.warnings.append(
                            f"Date {day.date}: {prayer_name} time ({prayer_time}) outside reasonable range "
                            f"({min_time} - {max_time})"
                        )
    
    def _check_seasonal_consistency(self, schedule: MonthlyPrayerSchedule):
        """Check if prayer times show expected seasonal patterns."""
        if len(schedule.schedule) < 7:  # Need at least a week to check trends
            return
        
        # Sort by date
        sorted_schedule = sorted(schedule.schedule, key=lambda x: x.date)
        
        # Check if sunrise/sunset times show expected gradual changes
        sunrise_times = [day.prayers.sunrise for day in sorted_schedule]
        sunset_times = [day.prayers.sunset for day in sorted_schedule]
        
        # Convert times to minutes for trend analysis
        sunrise_minutes = [t.hour * 60 + t.minute for t in sunrise_times]
        sunset_minutes = [t.hour * 60 + t.minute for t in sunset_times]
        
        # Check for consistent trends (should change gradually, not randomly)
        self._check_trend_consistency("sunrise", sunrise_minutes, sorted_schedule)
        self._check_trend_consistency("sunset", sunset_minutes, sorted_schedule)
    
    def _check_trend_consistency(self, prayer_name: str, minutes_list: List[int], 
                                sorted_schedule: List[DailyPrayerSchedule]):
        """Check if a prayer time shows consistent seasonal trends."""
        if len(minutes_list) < 7:
            return
        
        # Calculate day-to-day changes
        changes = [minutes_list[i+1] - minutes_list[i] for i in range(len(minutes_list)-1)]
        
        # Count direction changes (trend reversals)
        reversals = 0
        for i in range(len(changes)-1):
            if (changes[i] > 0 and changes[i+1] < 0) or (changes[i] < 0 and changes[i+1] > 0):
                if abs(changes[i]) > 2 and abs(changes[i+1]) > 2:  # Ignore minor fluctuations
                    reversals += 1
        
        # Too many reversals suggests parsing errors
        max_expected_reversals = len(changes) // 7  # Allow some variation
        if reversals > max_expected_reversals:
            self.warnings.append(
                f"{prayer_name} times show {reversals} trend reversals, suggesting possible parsing errors"
            )
    
    def _time_difference_minutes(self, time1: time, time2: time) -> float:
        """Calculate difference between two times in minutes."""
        # Convert to datetime objects for easier calculation
        base_date = datetime(2000, 1, 1)
        dt1 = datetime.combine(base_date, time1)
        dt2 = datetime.combine(base_date, time2)
        
        # Handle midnight wraparound
        if time2.hour < 12 and time1.hour > 12:
            dt2 += timedelta(days=1)
        
        diff = dt2 - dt1
        return diff.total_seconds() / 60

    def generate_report(self, check_results: Dict[str, Any]) -> str:
        """Generate a human-readable report of the sanity check results."""
        report = []
        report.append("=== PRAYER TIMES SANITY CHECK REPORT ===")
        report.append(f"Schedule: {check_results['city']} - {check_results['month']} {check_results['year']}")
        report.append(f"Total days parsed: {check_results['total_days']}")
        report.append("")
        
        if check_results['is_valid']:
            report.append("✅ OVERALL STATUS: PASSED")
        else:
            report.append("❌ OVERALL STATUS: FAILED")
        
        report.append("")
        
        if check_results['issues']:
            report.append("🚨 CRITICAL ISSUES:")
            for issue in check_results['issues']:
                report.append(f"  • {issue}")
            report.append("")
        
        if check_results['warnings']:
            report.append("⚠️  WARNINGS:")
            for warning in check_results['warnings']:
                report.append(f"  • {warning}")
            report.append("")
        
        if not check_results['issues'] and not check_results['warnings']:
            report.append("✨ No issues or warnings found! The parsing looks accurate.")
        
        return "\n".join(report)

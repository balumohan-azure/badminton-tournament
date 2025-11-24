# Court Scheduling Feature - Implementation Complete

## Overview

The court scheduling feature has been successfully implemented. This feature allows users to:

1. Define multiple time slots with varying numbers of available courts
2. Automatically schedule matches to maximize court utilization
3. View scheduled matches with court numbers and times in the Tournament Dashboard
4. Get warnings if there isn't enough court time for all matches
5. Persist schedules to the database for cross-session availability

## Database Migration Required

If you already have an existing Supabase database, you need to run the migration script:

```bash
# Open Supabase SQL Editor and run:
server/supabase-migration-court-schedule.sql
```

If you're setting up a fresh database, use the complete schema:

```bash
# Run the full schema in Supabase SQL Editor:
server/supabase-schema.sql
```

## How It Works

### 1. Court Schedule Input (Player Management Page)

- Users can enable court scheduling via a checkbox
- Add multiple time slots with:
  - Start time (e.g., 06:00)
  - End time (e.g., 07:00)
  - Number of courts available
- Real-time capacity calculation shows:
  - ✅ Green: Sufficient capacity (<80% utilization)
  - ⚠️ Yellow: Tight schedule (80-100% utilization)
  - ❌ Red: Insufficient capacity (>100% utilization)

### 2. Scheduling Algorithm

The backend algorithm (`scheduleMatches` function):

- Assumes each match takes 12 minutes (10-15 min average)
- Attempts 3-minute rest between consecutive matches per player
- **Prioritizes court utilization over player rest** (greedy approach)
- Schedules matches in order, filling earliest available slots
- Marks matches that couldn't fit as "Unscheduled"

### 3. Tournament Dashboard Display

Scheduled matches show:
- Court number and start time badge
- Summary alert showing scheduled vs unscheduled count
- Unscheduled matches display "Unscheduled" badge

### 4. Database Persistence

Schedule information is stored in:

**tournaments table:**
- `court_schedule` (JSONB) - stores the time slot configuration

**matches table:**
- `court_number` (INTEGER) - assigned court (1-indexed)
- `scheduled_start_time` (TEXT) - start time "HH:MM"
- `scheduled_end_time` (TEXT) - end time "HH:MM"

## API Changes

### Modified Endpoints

**POST /api/tournament/create**
- Added `courtSchedule` parameter (optional)
- Example:
```json
{
  "playerIds": ["uuid1", "uuid2", ...],
  "matchesPerPlayer": 5,
  "courtSchedule": {
    "timeSlots": [
      { "id": "slot-1", "startTime": "06:00", "endTime": "07:00", "courts": 3 },
      { "id": "slot-2", "startTime": "07:00", "endTime": "08:00", "courts": 2 }
    ]
  }
}
```

**GET /api/tournament/current**
- Now loads tournaments from database if not in memory
- Includes schedule information in fixtures
- Returns fixture with optional `schedule` field:
```json
{
  "schedule": {
    "courtNumber": 2,
    "startTime": "06:15",
    "endTime": "06:27"
  }
}
```

## Frontend Changes

### Updated Components

1. **PlayerManagement.tsx**
   - Added court schedule input UI
   - Capacity calculation and warnings
   - Schedule data passed to tournament creation

2. **TournamentDashboard.tsx**
   - Displays court and time for scheduled matches
   - Shows scheduling summary alert
   - "Unscheduled" badge for matches without schedule

### New TypeScript Types

```typescript
interface TimeSlot {
  id: string;
  startTime: string;  // "06:00"
  endTime: string;    // "07:00"
  courts: number;
}

interface CourtSchedule {
  timeSlots: TimeSlot[];
}

interface ScheduledMatch {
  courtNumber: number;
  startTime: string;  // "06:15"
  endTime: string;    // "06:27"
}

// Added to Fixture interface:
interface Fixture {
  // ... existing fields
  schedule?: ScheduledMatch;
}
```

## Usage Example

1. Navigate to Player Management
2. Select 12 players and set "Matches per Player" to 5
3. Check "Enable Court Scheduling"
4. Add time slots:
   - 6:00 AM to 7:00 AM - 3 courts
   - 7:00 AM to 8:00 AM - 2 courts
5. Review capacity indicator
6. Click "Create Tournament"
7. View scheduled matches in Tournament Dashboard

## Technical Details

### Scheduling Algorithm Pseudocode

```
For each fixture:
  1. Get all 4 players in the match
  2. Find earliest time block with available court
  3. Check if all players are free (previous match ended)
  4. If yes:
     - Assign match to court and time
     - Update player availability
  5. If no available slot:
     - Mark as unscheduled
```

### Capacity Calculation

```
Total Court Minutes = Σ(courts × duration) for all time slots
Required Minutes = matches × 12
Utilization = (Required / Total) × 100%
```

### Rest Time Priority

- Algorithm **prioritizes filling courts** over player rest
- 3-minute rest is attempted but not guaranteed
- Players can play back-to-back if needed to maximize utilization

## Future Enhancements (Not Implemented)

- Dynamic match duration (user configurable)
- Guaranteed minimum rest time (constraint-based scheduling)
- Court preference/priority for specific matches
- Re-scheduling unscheduled matches manually
- Export schedule to PDF/Calendar
- Real-time schedule updates during tournament

## Testing Recommendations

1. **Small Tournament Test**
   - 4 players, 3 matches
   - 1 time slot, 1 court
   - Verify all matches scheduled

2. **Capacity Warning Test**
   - 12 players, 8 matches per player
   - 1 time slot (60 min), 2 courts
   - Should show "Insufficient capacity" warning

3. **Multi-Slot Test**
   - 8 players, 5 matches
   - Multiple time slots with varying courts
   - Verify matches distributed across slots

4. **Database Persistence Test**
   - Create scheduled tournament
   - Restart server OR open in new tab
   - Verify schedule persists

## Files Modified

### Backend
- `server/index.js` - Added scheduleMatches function, updated endpoints
- `server/supabase-schema.sql` - Added schedule columns
- `server/supabase-migration-court-schedule.sql` - Migration script (NEW)

### Frontend
- `client/src/types/index.ts` - Added schedule interfaces
- `client/src/services/api.ts` - Updated createTournament signature
- `client/src/components/PlayerManagement.tsx` - Court schedule UI
- `client/src/components/TournamentDashboard.tsx` - Schedule display

## Support

If you encounter issues:

1. Check Supabase migration ran successfully
2. Verify court_schedule column exists in tournaments table
3. Verify schedule columns exist in matches table
4. Check browser console for API errors
5. Check Render.com logs for backend errors

---

**Implementation Status:** ✅ Complete
**Database Persistence:** ✅ Enabled (Option 5a)
**Cross-Session Support:** ✅ Supported


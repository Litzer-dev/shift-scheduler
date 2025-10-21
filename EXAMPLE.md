# Example Usage

## Sample Team Schedule

Here's an example of how to set up your team for a typical day:

### Morning Shift Team (7:00 AM - 3:00 PM)
1. **John Smith**
   - Shift: 07:00 - 15:00
   - Status: Present

2. **Sarah Johnson**
   - Shift: 07:00 - 15:00
   - Status: Present

### Afternoon Shift Team (3:00 PM - 11:00 PM)
3. **Mike Davis**
   - Shift: 15:00 - 23:00
   - Status: Present

4. **Lisa Anderson**
   - Shift: 15:00 - 23:00
   - Status: Present

### Full Day Coverage (7:00 AM - 11:00 PM)
5. **Tom Wilson**
   - Shift: 07:00 - 23:00
   - Status: Present (Floater)

## Expected Rotation Output

With the above schedule (5 team members), the app will generate:

### Morning Hours (7:00 AM - 3:00 PM)
Available: John, Sarah, and Tom (3 people)
- **Hour 1**: John (outside), Sarah (inside), Tom (floater)
- **Hour 2**: Sarah (outside), Tom (inside), John (floater)
- **Hour 3**: Tom (outside), John (inside), Sarah (floater)
- Pattern continues rotating through all three positions

### Afternoon Hours (3:00 PM - 11:00 PM)
Available: Mike, Lisa, and Tom (3 people)
- **Hour 1**: Mike (outside), Lisa (inside), Tom (floater)
- **Hour 2**: Lisa (outside), Tom (inside), Mike (floater)
- **Hour 3**: Tom (outside), Mike (inside), Lisa (floater)
- Pattern continues rotating through all three positions

### Key Points
- Tom bridges both shifts for continuity
- Everyone gets equal time in each position
- No one is assigned to multiple positions in the same hour

## Tips for Best Results

1. **Stagger Shift Times**: If possible, have overlapping shifts for smooth transitions
2. **Mark Absences**: Always update presence status at the start of the day
3. **Review Before Generating**: Check that all shift times are correct
4. **Save the Schedule**: Take a screenshot or print for reference
5. **Update as Needed**: Regenerate if team members arrive late or leave early

## Common Scenarios

### Scenario 1: Someone Calls Out
- Toggle their status to "Absent"
- Regenerate the rotation
- Remaining team members will cover the positions

### Scenario 2: Early Departure
- Update their shift end time
- Regenerate to reflect the change
- Rotation adjusts automatically

### Scenario 3: Late Arrival
- Update their shift start time
- Regenerate the schedule
- They'll be assigned starting from their actual arrival time

### Scenario 4: Different Team Sizes
- **2 people**: 1 outside, 1 inside (alternating each hour)
- **3 people**: 1 outside, 1 inside (3rd person rotates in)
- **4 people**: 1 outside, 1 inside (all 4 rotate through both positions)
- **5+ people**: 1 outside, 1 inside, 1 floater (all rotate through all 3 positions)

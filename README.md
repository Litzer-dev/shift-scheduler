# Team Shift Scheduler - Outside Rotation Generator

A modern web application that helps you manage team member schedules and automatically generates outside position rotations based on existing shift assignments.

## Features

- **Schedule Input**: Enter each team member's existing shift times (start and end)
- **Presence Tracking**: Mark which team members are present/absent for the day
- **Smart Outside Rotation**: Automatically generates hourly outside position assignments
- **Schedule-Aware**: Only assigns members to outside positions during their scheduled shift hours
- **Hourly Breakdown**: Shows assignments from 7:00 AM to 11:00 PM in 1-hour slots
- **Fair Rotation**: Ensures equal distribution of outside duties among available members
- **Visual Display**: Clean, easy-to-read schedule table
- **Local Storage**: Team member data persists across sessions

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm, yarn, pnpm, or bun package manager

### Installation

1. Navigate to the project directory:
```bash
cd shift-scheduler
```

2. Install dependencies (if not already installed):
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## How to Use

### 1. Add Team Members with Schedules
- Enter the team member's name
- Set their **Shift Start** time (e.g., 7:00 AM)
- Set their **Shift End** time (e.g., 3:00 PM)
- Click "Add Team Member"
- Team members are automatically marked as "Present"

### 2. Manage Team Schedules
- Each team member card shows their current schedule
- Edit shift times directly in the card using the time inputs
- Toggle presence status (Present/Absent) for the day
- Remove team members if needed

### 3. Generate Rotation
- Select the date for the rotation
- Review the configuration panel showing present members
- Click "Generate Outside Rotation"
- The app creates hourly assignments for outside, inside, and floater positions

### 4. View Rotation Schedule
- The schedule displays all hours from 7:00 AM to 11:00 PM
- Three columns: **Outside**, **Inside**, and **Floater** (if 5+ members)
- Color-coded badges:
  - **Orange**: Outside position
  - **Blue**: Inside position
  - **Purple**: Floater position
- "—" appears when no one is available for that hour
- Members are only assigned during their scheduled shift times

## How the Rotation Works

The application intelligently assigns positions based on team size:

### Position Rules
The team is **split evenly** between outside and inside positions. If there's an **odd number**, the extra person becomes a floater.

### Team Size Configurations
- **2 Members**: 1 outside + 1 inside
- **3 Members**: 1 outside + 1 inside + 1 floater
- **4 Members**: 2 outside + 2 inside
- **5 Members**: 2 outside + 2 inside + 1 floater
- **6 Members**: 3 outside + 3 inside
- **7 Members**: 3 outside + 3 inside + 1 floater
- And so on...

### Smart Features
- **Schedule-Aware**: Only assigns members during their actual shift hours (after shift starts, before shift ends)
- **On-the-Clock Check**: Members are only assigned if their shift has already started
- **Fair Distribution**: Rotates through available members to ensure equal duty time
- **No Overlap**: Same person never assigned to multiple positions in the same hour
- **Automatic Rotation**: Members cycle through positions throughout the day
- **Handles Gaps**: Shows "—" when no one is available for a time slot

### How Shift Timing Works

The app checks each hour to see who is **currently on the clock**:

**Example:** John's shift is 9:00 AM - 5:00 PM
- ❌ **8:00 AM - 9:00 AM**: Not assigned (shift hasn't started yet)
- ✅ **9:00 AM - 10:00 AM**: Assigned (shift has started)
- ✅ **10:00 AM - 11:00 AM**: Assigned (still on shift)
- ✅ **4:00 PM - 5:00 PM**: Assigned (last hour of shift)
- ❌ **5:00 PM - 6:00 PM**: Not assigned (shift has ended)

### Example Scenario: 4 Team Members

If you have:
- **John**: 7:00 AM - 3:00 PM
- **Sarah**: 7:00 AM - 3:00 PM  
- **Mike**: 3:00 PM - 11:00 PM
- **Lisa**: 3:00 PM - 11:00 PM

**Morning (7 AM - 3 PM):** 2 people available → 1 outside, 1 inside
- Hour 1: John (outside), Sarah (inside)
- Hour 2: Sarah (outside), John (inside)
- Continues rotating...

**Afternoon (3 PM - 11 PM):** 2 people available → 1 outside, 1 inside
- Hour 1: Mike (outside), Lisa (inside)
- Hour 2: Lisa (outside), Mike (inside)
- Continues rotating...

### Example Scenario: 5 Team Members

Same as above, plus:
- **Tom**: 7:00 AM - 11:00 PM (full day)

**Morning (7 AM - 3 PM):** 3 people available → 1 outside, 1 inside, 1 floater
- Hour 1: John (outside), Sarah (inside), Tom (floater)
- Hour 2: Sarah (outside), Tom (inside), John (floater)
- Hour 3: Tom (outside), John (inside), Sarah (floater)
- Continues rotating through all three...

**Afternoon (3 PM - 11 PM):** 3 people available → 1 outside, 1 inside, 1 floater
- Hour 1: Mike (outside), Lisa (inside), Tom (floater)
- Hour 2: Lisa (outside), Tom (inside), Mike (floater)
- Continues rotating through all three...

### Example Scenario: 6 Team Members

With 6 people working the same shift:
- **6 people available** → 3 outside, 3 inside
- Hour 1: Person1, Person2, Person3 (outside) | Person4, Person5, Person6 (inside)
- Hour 2: Person4, Person5, Person6 (outside) | Person1, Person2, Person3 (inside)
- Teams swap between outside and inside each hour for fair distribution

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **Data Persistence**: Browser localStorage

## Project Structure

```
shift-scheduler/
├── src/
│   ├── app/
│   │   └── page.tsx          # Main application page
│   ├── types/
│   │   └── index.ts          # TypeScript type definitions
│   └── utils/
│       └── shiftRotation.ts  # Shift generation logic
├── public/                    # Static assets
└── package.json              # Dependencies
```

## Use Cases

This application is perfect for:
- **Security teams** managing outside patrol rotations
- **Retail stores** scheduling door/greeter positions
- **Warehouses** assigning loading dock positions
- **Facilities** managing entrance monitoring
- **Events** coordinating outdoor staff positions
- Any team needing fair rotation of outside/external duties

## Future Enhancements

Potential features for future development:
- Export rotation to PDF or CSV
- Multi-day schedule generation
- Custom number of outside positions
- Break time management
- Swap/trade shift functionality
- Email/SMS notifications
- Database integration for team collaboration
- Mobile app version
- Print-friendly view

## Deploy on Vercel

The easiest way to deploy this app is using the [Vercel Platform](https://vercel.com/new):

1. Push your code to GitHub
2. Import the repository in Vercel
3. Deploy with one click

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

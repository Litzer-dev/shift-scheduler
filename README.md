# 📅 Weekly Team Shift Scheduler

A modern web application for managing team schedules and generating fair shift rotations for the entire week. Perfect for teams that need to rotate positions fairly while respecting individual schedules.

![Next.js](https://img.shields.io/badge/Next.js-15-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8) ![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

### 📅 Weekly Schedule Management
- **7-Day Schedules**: Set different shift times for each day of the week
- **Day Off Support**: Mark weekends or specific days as off
- **Flexible Shifts**: Different start/end times for each day
- **Quick Copy**: Copy one day's schedule to the entire week
- **Per-Day Presence**: Mark if someone is present/absent each day

### 🔄 Smart Rotation System
- **Even Split**: Team automatically divided evenly between outside and inside positions
- **Floater Support**: Odd-numbered teams get a floater to help where needed
- **Fair Distribution**: No one stays in the same position for consecutive hours
- **Schedule-Aware**: Only assigns members during their actual shift hours
- **Per-Hour Calculation**: Adapts to who's available each hour of each day

### 💾 Data Management
- **Browser Storage**: All data saved locally (no server or database needed)
- **Week View**: Generate and view rotations for entire week at once
- **Easy Editing**: Intuitive interface for schedule management
- **Persistent Data**: Team schedules saved between sessions

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/shift-scheduler.git
cd shift-scheduler

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Build for Production

```bash
npm run build
npm start
```

## 📖 How to Use

### 1. Add Team Members
1. Enter a team member's name
2. Click "Add Member"
3. New members get a default schedule (Mon-Fri 7AM-3PM, weekends off)

### 2. Edit Weekly Schedules
1. Click "Edit Schedule" on any team member
2. See a 7-day grid with each day's schedule
3. For each day:
   - Check "Off" if it's a day off
   - Check "Present" if they're working that day
   - Set shift start and end times
   - Click "Copy to Week" to apply that day's schedule to all days

### 3. Generate Week Rotation
1. Select the week starting date (Monday)
2. Click "Generate Week Rotation"
3. View hourly rotations for all 7 days

### 4. View Rotations
- Each day shows hourly breakdown (7 AM - 11 PM)
- Color-coded positions:
  - 🟠 **Orange**: Outside position
  - 🔵 **Blue**: Inside position
  - 🟣 **Purple**: Floater position
- "—" appears when no one is available

## 🎯 How the Rotation Works

### Position Assignment Rules

The team is **split evenly** between outside and inside positions. If there's an **odd number**, the extra person becomes a floater.

**Examples:**
- **2 people**: 1 outside + 1 inside
- **3 people**: 1 outside + 1 inside + 1 floater
- **4 people**: 2 outside + 2 inside
- **5 people**: 2 outside + 2 inside + 1 floater
- **6 people**: 3 outside + 3 inside
- **7 people**: 3 outside + 3 inside + 1 floater

### Fair Rotation Logic

**No Consecutive Same Position**: The system ensures no one stays in the same position for back-to-back hours.

**Example with 3 people:**
- **Hour 1**: John (outside), Sarah (inside), Mike (floater)
- **Hour 2**: Sarah (outside), Mike (inside), John (floater)
- **Hour 3**: Mike (outside), John (inside), Sarah (floater)
- Pattern continues...

### Schedule-Aware Assignment

The app only assigns people during their actual shift hours:

**Example**: John works 9 AM - 5 PM
- ❌ 8:00-9:00 AM: Not assigned (shift hasn't started)
- ✅ 9:00-10:00 AM: Assigned (on the clock)
- ✅ 4:00-5:00 PM: Assigned (last hour)
- ❌ 5:00-6:00 PM: Not assigned (shift ended)

### Dynamic Per-Hour Calculation

If team composition changes during the day (someone starts at noon), the rotation adapts:

**Example**: 4 people total, but only 3 work in the morning
- **7 AM - 12 PM**: 3 people → 1 outside, 1 inside, 1 floater
- **12 PM - 11 PM**: 4 people → 2 outside, 2 inside

## 🛠️ Technology Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: React Hooks
- **Storage**: Browser localStorage

## 📁 Project Structure

```
shift-scheduler/
├── src/
│   ├── app/
│   │   └── page.tsx              # Main application UI
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces
│   └── utils/
│       ├── shiftRotation.ts      # Rotation logic
│       └── scheduleHelpers.ts    # Schedule utilities
├── public/                        # Static assets
├── package.json                   # Dependencies
└── README.md                      # Documentation
```

## 🎯 Use Cases

Perfect for teams that need to rotate positions fairly:

- **Security Teams**: Patrol and monitoring rotations
- **Retail Stores**: Door greeter and checkout rotations
- **Warehouses**: Loading dock and inventory positions
- **Facilities**: Entrance monitoring and reception
- **Restaurants**: Host stand and server rotations
- **Events**: Outdoor staff and entrance coordination

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com/new)
3. Import your repository
4. Click "Deploy"

### Deploy to Netlify

1. Push your code to GitHub
2. Go to [Netlify](https://app.netlify.com/start)
3. Import your repository
4. Build command: `npm run build`
5. Publish directory: `.next`

### Deploy to GitHub Pages

This app uses client-side storage, so it works great as a static site!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons from [Heroicons](https://heroicons.com/)

## 📧 Support

If you have any questions or run into issues, please open an issue on GitHub.

---

Made with ❤️ for teams that value fair scheduling

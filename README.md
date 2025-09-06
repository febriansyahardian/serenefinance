# Serene Finance - Personal Budget & Wishlist Tracker

A minimalist personal finance web app designed with 2025 aesthetics, featuring a calm and motivating interface for managing monthly budgets and tracking savings progress for wishlist items.

## ✨ Features

### 🏠 Dashboard
- **Financial Summary**: Overview of monthly income, expenses, and remaining budget
- **Overall Progress**: Visual progress tracking across all wishlist items
- **Quick Actions**: Easy access to create budgets, add wishlist items, and record savings
- **Wishlist Preview**: Glimpse of your current wishlist items with progress bars

### 💰 Budget Management
- **Monthly Budgeting**: Input income and categorize expenses
- **Expense Categories**: Flexible expense tracking (food, transportation, entertainment, etc.)
- **Wishlist Integration**: Allocate funds specifically for wishlist savings
- **Real-time Summary**: Live calculation of income vs expenses
- **Financial Overview**: Clear visualization of budget health

### 🎯 Wishlist & Savings
- **Item Management**: Add items with name, price, image, and target date
- **Progress Tracking**: Visual progress bars with percentage completion
- **Saving Entries**: Record savings with notes and dates
- **Smart Recommendations**: Automatic suggestions for weekly/monthly saving amounts
- **Target Deadlines**: Set and track progress towards purchase goals

### 🎨 Design Features
- **2025 Aesthetic**: Modern minimalist design with soft colors
- **Calming Palette**: Sage greens, muted blues, warm beiges, and off-white backgrounds
- **Smooth Animations**: Subtle micro-interactions and progress animations
- **Glassmorphism**: Soft glass overlays and backdrop blur effects
- **Responsive Design**: Mobile-first approach that scales beautifully to desktop
- **Accessibility**: Clean typography and intuitive navigation

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone or download the project**
   ```bash
   cd newpro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build CSS**
   ```bash
   npm run build-css
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

### Development Mode

For development with auto-reload:
```bash
npm run dev
```

For CSS watching (rebuilds on changes):
```bash
npm run build-css
```

## 🛠️ Technology Stack

- **Backend**: Node.js with Express
- **Frontend**: Vanilla JavaScript with modern ES6+
- **Styling**: Tailwind CSS with custom 2025 design system
- **Data Storage**: In-memory (easily replaceable with database)
- **Icons**: Heroicons (SVG)
- **Fonts**: Inter (Google Fonts)

## 📱 User Experience Flow

1. **Dashboard**: Start with financial overview and wishlist progress
2. **Budget Page**: Create monthly budgets with income and expense tracking
3. **Wishlist Page**: Add items you want to save for
4. **Item Details**: View saving history, progress, and get recommendations
5. **Quick Actions**: Add savings entries from anywhere in the app

## 🎨 Design Philosophy

The app embodies the 2025 design trend of **calm technology** - creating a serene, distraction-free environment that makes financial management feel peaceful and motivating rather than stressful.

### Key Design Principles:
- **Minimalism**: Clean layouts with plenty of whitespace
- **Softness**: Rounded corners (2xl) and gentle shadows
- **Tranquility**: Soothing color palette that reduces anxiety
- **Clarity**: Clear typography and intuitive information hierarchy
- **Progress**: Visual feedback that celebrates small wins

## 🔧 API Endpoints

### Budgets
- `GET /api/budgets` - Get all budgets
- `POST /api/budgets` - Create new budget
- `PUT /api/budgets/:id` - Update budget

### Wishlists
- `GET /api/wishlists` - Get all wishlist items
- `POST /api/wishlists` - Add new wishlist item
- `PUT /api/wishlists/:id` - Update wishlist item
- `DELETE /api/wishlists/:id` - Delete wishlist item

### Savings
- `GET /api/savings` - Get all savings entries
- `GET /api/savings/wishlist/:wishlistId` - Get savings for specific item
- `POST /api/savings` - Add new saving entry

### Dashboard
- `GET /api/dashboard` - Get dashboard summary data

## 🎯 Future Enhancements

- **Database Integration**: Replace in-memory storage with persistent database
- **User Authentication**: Multi-user support with secure login
- **Data Export**: Export budgets and savings to CSV/PDF
- **Notifications**: Reminders for saving goals and budget limits
- **Analytics**: Spending trends and saving pattern insights
- **Mobile App**: Native mobile application
- **Bank Integration**: Connect with bank accounts for automatic tracking

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

This is a personal project, but suggestions and improvements are welcome! The codebase is designed to be easily extensible and maintainable.

---

**Built with ❤️ for a more serene approach to personal finance management.**


sirenefinance/
├── api/                    # Serverless functions (5 files)
│   ├── data.js            # Shared data & helpers
│   ├── dashboard.js       # Dashboard API
│   ├── wishlists.js      # Wishlist CRUD
│   ├── money-entries.js  # Money tracking
│   └── savings.js        # Savings management
├── public/                # Static assets
│   ├── css/style.css     # Built CSS
│   └── js/app.js         # Frontend logic
├── src/                   # Source files
│   └── input.css         # Tailwind source
├── index.html            # Main page
├── package.json          # Minimal dependencies
├── vercel.json           # Vercel config
└── DEPLOY.md             # Simple deployment guide

Details 
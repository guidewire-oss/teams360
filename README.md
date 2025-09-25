# Team360 Health Check

A comprehensive web application implementing the Spotify Squad Health Check Model for tracking and improving team health metrics.

## 🚀 Quick Start

```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

## 🔑 Login Credentials

- **Team Member**: `demo/demo`
- **Manager**: `manager/manager`  
- **Administrator**: `admin/admin`

## 📋 Features

### For Team Members
- Complete quarterly health check surveys
- Rate 8 dimensions on a red/yellow/green scale
- Track trends (improving/stable/declining)
- Add optional comments for context

### For Managers
- View team health summaries with visual dashboards
- Monitor health trends over time
- Compare metrics across multiple teams
- Analyze response distributions

### For Administrators
- Manage teams and users
- Configure health check cadences (weekly/monthly/quarterly)
- Customize health dimensions
- Set up notification preferences

## 🎯 Health Dimensions

Based on Spotify's model, teams assess:

1. **Mission** - Clear purpose and excitement
2. **Delivering Value** - Pride in output and stakeholder satisfaction
3. **Speed** - Quick delivery without delays
4. **Fun** - Enjoyment and team cohesion
5. **Health of Codebase** - Clean code and technical debt management
6. **Learning** - Continuous improvement and knowledge growth
7. **Support** - Access to help when needed
8. **Pawns or Players** - Autonomy and control over destiny

## 🛠 Technology Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Lucide React** - Icons
- **React Hook Form** - Form handling
- **js-cookie** - Cookie management

## 📁 Project Structure

```
/app
  /login          - Authentication page
  /survey         - Health check survey for team members
  /manager        - Manager dashboard with analytics
  /admin          - Administration panel
/lib
  /auth.ts        - Authentication logic
  /data.ts        - Data management and storage
  /types.ts       - TypeScript type definitions
/middleware.ts    - Route protection and redirects
```

## 🎨 Key Features

### Survey Experience
- Step-by-step wizard interface
- Visual progress tracking
- Intuitive red/yellow/green selection
- Trend indicators
- Optional comments for context

### Manager Dashboard
- **Overview Tab**: Radar chart and distribution graphs
- **Details Tab**: Dimension-by-dimension breakdown
- **Trends Tab**: Historical data visualization
- Team statistics and next check reminders

### Admin Panel
- Team management with CRUD operations
- User administration
- Cadence configuration
- System settings
- Data retention policies

## 📊 Data Visualization

- **Radar Charts** - Overall team health at a glance
- **Stacked Bar Charts** - Response distribution
- **Line Charts** - Trend analysis over time
- **Color-coded Metrics** - Instant visual feedback

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables
Create a `.env.local` file for production:
```env
# Add your environment variables here
NEXT_PUBLIC_API_URL=your-api-url
```

## 🔄 Future Enhancements

- [ ] Email notifications for upcoming checks
- [ ] CSV/Excel export functionality
- [ ] Team comparison features
- [ ] Historical trend analysis
- [ ] Mobile responsive improvements
- [ ] Real-time collaboration
- [ ] Integration with project management tools
- [ ] Backend API integration
- [ ] Database persistence

## 📚 References

- [Spotify Engineering - Squad Health Check Model](https://engineering.atspotify.com/2014/09/squad-health-check-model/)
- [Next.js Documentation](https://nextjs.org/docs)

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
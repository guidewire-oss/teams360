## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Username/password login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/sso/callback` - Exchange OAuth authorization code for JWT tokens (SSO)

### Health Checks
- `POST /api/v1/health-checks` - Submit health check
- `GET /api/v1/health-checks/:id` - Get health check by ID
- `GET /api/v1/health-dimensions` - List all dimensions

### Teams
- `GET /api/v1/teams` - List teams
- `GET /api/v1/teams/:teamId/info` - Get team info
- `GET /api/v1/teams/:teamId/dashboard/health-summary` - Team health summary
- `GET /api/v1/teams/:teamId/dashboard/trends` - Team health trends
- `POST /api/v1/teams` - Create team
- `PUT /api/v1/teams/:id` - Update team
- `DELETE /api/v1/teams/:id` - Delete team

### Managers
- `GET /api/v1/managers/:managerId/teams/health` - Get supervised teams' health
- `GET /api/v1/managers/:managerId/dashboard/trends` - Aggregated trends

### Users
- `GET /api/v1/users/:userId/survey-history` - User's survey history

### Admin - Hierarchy Levels
- `GET /api/v1/admin/hierarchy-levels` - List all hierarchy levels
- `POST /api/v1/admin/hierarchy-levels` - Create hierarchy level
- `PUT /api/v1/admin/hierarchy-levels/:id` - Update hierarchy level
- `PUT /api/v1/admin/hierarchy-levels/:id/position` - Reorder hierarchy level
- `DELETE /api/v1/admin/hierarchy-levels/:id` - Delete hierarchy level

### Admin - Users
- `GET /api/v1/admin/users` - List all users
- `POST /api/v1/admin/users` - Create user
- `PUT /api/v1/admin/users/:id` - Update user
- `DELETE /api/v1/admin/users/:id` - Delete user

### Admin - Teams
- `GET /api/v1/admin/teams` - List all teams
- `POST /api/v1/admin/teams` - Create team
- `PUT /api/v1/admin/teams/:id` - Update team
- `DELETE /api/v1/admin/teams/:id` - Delete team
- `POST /api/v1/admin/teams/:teamId/members` - Add member to team
- `DELETE /api/v1/admin/teams/:teamId/members/:userId` - Remove member from team

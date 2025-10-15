# Teams and Friends Feature Implementation

## Overview
This document describes the implementation of the Teams and Friends collaboration feature for ToDoFast2.

## Features Implemented

### 1. Backend Models

#### Friend Model (`todo/models.py`)
- **Purpose**: Manages friend relationships between users
- **Fields**:
  - `user`: The user who initiated the friendship
  - `friend`: The user who received the friend request
  - `status`: pending, accepted, or declined
  - `created_at`, `updated_at`: Timestamps
- **Methods**:
  - `accept()`: Accepts a friend request and creates reciprocal friendship
  - `decline()`: Declines a friend request

#### Updated Team Model
- Already existed in the codebase
- Supports team creation, members, and projects

### 2. Backend API

#### FriendViewSet (`todo/api_views.py`)
Endpoints available at `/api/friends/`:
- `GET /api/friends/` - Get all friendships
- `GET /api/friends/list_friends/` - Get accepted friends only
- `GET /api/friends/pending_requests/` - Get pending friend requests (received)
- `POST /api/friends/send_request/` - Send a friend request (body: `{email: "friend@example.com"}`)
- `POST /api/friends/{id}/accept/` - Accept a friend request
- `POST /api/friends/{id}/decline/` - Decline a friend request
- `DELETE /api/friends/{id}/` - Remove a friendship

#### TeamViewSet (Already existed)
Endpoints available at `/api/teams/`:
- Standard CRUD operations for teams
- `POST /api/teams/{id}/add_member/` - Add member to team
- `POST /api/teams/{id}/remove_member/` - Remove member from team
- `GET /api/teams/{id}/projects/` - Get team projects

### 3. Frontend Components

#### FriendListModal (`frontend/src/components/FriendListModal.jsx`)
- **Features**:
  - Add friends by email
  - View all friends with their names and emails
  - Accept/decline pending friend requests
  - Remove friends
  - Two tabs: "Friends" and "Pending Requests"
  - Real-time notifications for success/error
  - Beautiful Hebrew UI with RTL support

#### TeamProjectModal (`frontend/src/components/TeamProjectModal.jsx`)
- **Features**:
  - Create projects under specific teams
  - Assign friends to team projects
  - Select from 12 color options
  - Add project name and description
  - Visual preview of the project
  - Shows selected team and member count

#### Updated Sidebar (`frontend/src/components/Sidebar.jsx`)
- **New Elements**:
  - "רשימת חברים" (Friend List) button below teams section
  - Green UsersIcon for friend list
  - Integrates seamlessly with existing team structure

### 4. Frontend API Service

#### friendAPI (`frontend/src/services/api.js`)
New API functions:
```javascript
friendAPI.getFriends()              // Get all accepted friends
friendAPI.getAllFriendships()       // Get all friendships
friendAPI.sendRequest(email)        // Send friend request
friendAPI.acceptRequest(id)         // Accept request
friendAPI.declineRequest(id)        // Decline request
friendAPI.getPendingRequests()      // Get pending requests
friendAPI.deleteFriend(id)          // Remove friend
```

## How to Use

### Adding Friends
1. Click "רשימת חברים" (Friend List) in the sidebar below teams
2. Enter friend's email address in the input field
3. Click "הוסף חבר" (Add Friend)
4. Friend receives a request that they can accept or decline

### Creating Team Projects
1. Create a team using the "הוסף צוות" (Add Team) button
2. Click the "+" button next to "הפרויקטים שלי" (My Projects)
3. Select the team from the dropdown
4. Enter project name and description
5. Choose a color
6. Select friends to assign to the project (from your friend list)
7. Click "צור פרויקט צוות" (Create Team Project)

### Assigning Friends to Projects
- When creating a team project, you can select multiple friends
- Selected friends will have access to view and edit tasks in that project
- You can add/remove members later by editing the project

## Database Migration Required

**IMPORTANT**: Before the feature can be used, you must run:

```bash
# Navigate to project directory
cd "c:\Users\liron\OneDrive\שולחן העבודה\New folder\ToDoFast2"

# Create migration for Friend model
python manage.py makemigrations

# Apply migration
python manage.py migrate
```

## File Changes Summary

### Backend Files Modified:
1. `todo/models.py` - Added Friend model
2. `todo/serializers.py` - Added FriendSerializer
3. `todo/api_views.py` - Added FriendViewSet with all endpoints
4. `todo/api_urls.py` - Registered friends router

### Frontend Files Modified:
1. `frontend/src/services/api.js` - Added friendAPI functions
2. `frontend/src/components/Sidebar.jsx` - Added Friend List button and UsersIcon import
3. `frontend/src/App.jsx` - Added Friend List and Team Project modals, handlers, and state

### Frontend Files Created:
1. `frontend/src/components/FriendListModal.jsx` - Friend management modal
2. `frontend/src/components/TeamProjectModal.jsx` - Team project creation with member assignment

## Future Enhancements

Potential features to add:
- Notifications when friend requests are received
- Team chat or messaging
- Activity feed showing team member actions
- Role-based permissions (admin, member, viewer)
- Team dashboards with statistics
- Export team reports
- Integration with external collaboration tools

## Technical Notes

### Security
- All endpoints require authentication (`permissions.IsAuthenticated`)
- Users can only manage their own friend requests
- Team project members are validated against user's friend list

### RTL Support
- All new components fully support Hebrew RTL layout
- Proper text alignment and icon positioning
- Hebrew labels and error messages

### Error Handling
- Friendly Hebrew error messages
- Success notifications with auto-dismiss
- Validation for duplicate friend requests
- Prevents self-friending

## Testing

To test the feature:
1. Create two user accounts
2. Log in as User A and send a friend request to User B's email
3. Log in as User B and accept the request in Friend List modal
4. Create a team as User A
5. Create a team project and assign User B
6. Both users should now see the project in their team projects

## Support

For issues or questions about this implementation, refer to:
- Backend API: `/api/friends/` endpoints in Django REST framework browsable API
- Frontend components: Check browser console for errors
- Database: Verify Friend model records in Django admin panel

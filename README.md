# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Push Notifications

This app includes push notification support for real-time updates about matches and session activity.

### Database Setup

Run the database migration to add push token support:

```sql
-- Run this in your Supabase SQL editor or via CLI
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_token TEXT;
CREATE INDEX IF NOT EXISTS idx_users_push_token ON users(push_token);
```

Or use the provided migration script:

```bash
# If using Supabase CLI
supabase db push
```

### Features

- **Automatic Registration**: Push tokens are automatically registered when users sign in
- **Real-time Notifications**: Users receive push notifications for:
  - New movie matches
  - Session join notifications
- **In-App Notifications**: All notifications are also stored in-app for history

### Testing Push Notifications

1. Build a development client: `npx expo run:android` or `npx expo run:ios`
2. Sign in to the app
3. Grant notification permissions when prompted
4. Trigger a notification (e.g., get a movie match)

## Account Deletion

The app includes a permanent account deletion feature that completely removes all user data.

### What Gets Deleted

When a user deletes their account, the following data is permanently removed:
- User profile and authentication (Clerk)
- All swipe history
- All movie matches
- All notifications (in-app and push)
- All invitations sent/received
- All active swipe sessions
- All debate sessions

### How to Use

1. Go to Profile tab
2. Scroll to the bottom
3. Tap "Delete Account"
4. Confirm through two warning dialogs
5. Account and all data will be permanently deleted

### Safety Features

- **Double confirmation**: Two separate alert dialogs prevent accidental deletion
- **Complete data removal**: All user data is deleted from both Supabase and Clerk
- **No recovery**: Deletion is permanent and cannot be undone

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

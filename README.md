# SafeHer 2.0 – Women Safety Mobile Application

SafeHer 2.0 is a women safety mobile application built using Expo React Native with a Node.js/Express backend and MongoDB Atlas. The platform is designed to improve personal safety through emergency SOS activation, live location sharing, trusted contact alerts, fake emergency calls, check-in features, and community-based emergency support.

The application focuses on enabling users to quickly access help during emergencies using location services, SMS communication, and push notifications.

---

## Features

### Emergency SOS System

* Hold-to-activate emergency SOS
* Live GPS tracking during emergencies
* Community SOS alerts
* Real-time location updates
* Emergency support workflow

### Trusted Contacts

* Save trusted emergency contacts
* Quick emergency communication
* SMS-based alert sharing

### Fake Call Assistance

* Fake incoming call simulation
* Outgoing call screen support
* Escape mechanism during unsafe situations

### Live Location Tracking

* GPS location fetching
* Real-time location synchronization
* Map-based location viewing

### Push Notifications

* Expo push notification support
* Emergency alerts to nearby users
* Notification-based SOS response system

### Authentication & Session Management

* User registration and login
* Persistent login sessions
* AsyncStorage integration

### Check-in Feature

* Safety confirmation check-ins
* Emergency monitoring workflow

### SOS History

* Local emergency history storage
* Previously triggered alerts tracking

---

## Tech Stack

### Frontend

* Expo React Native
* JavaScript
* React Navigation
* AsyncStorage
* Expo Notifications
* Expo Location

### Backend

* Node.js
* Express.js

### Database

* MongoDB Atlas

---

## Application Architecture

SafeHer follows a frontend–backend architecture.

User → React Native App → Express Backend → MongoDB Atlas
　　　　　　　　　　　　　 ↓
　　　　　　　 Expo Push Notifications

The mobile application handles UI, permissions, SMS, GPS tracking, and emergency workflows while the backend manages authentication, user data, location syncing, and community SOS notifications.

---

## Project Structure

```txt
safeher-2.0/
│── android/
│── src/
│   ├── screens/
│   │   ├── CheckInScreen.js
│   │   ├── ContactsScreen.js
│   │   ├── FakeCallScreen.js
│   │   ├── HistoryScreen.js
│   │   ├── HomeScreen.js
│   │   ├── IncomingCallScreen.js
│   │   ├── LiveSOSModal.js
│   │   ├── LoginScreen.js
│   │   ├── MapScreen.js
│   │   ├── OnboardingScreen.js
│   │   ├── OutgoingCallScreen.js
│   │   ├── RegisterScreen.js
│   │   ├── SettingsScreen.js
│   │   ├── SOSScreen.js
│   │   └── SplashScreen.js
│── utils/
│── App.js
│── package.json
│── README.md
```

---

## Core Workflow

### Authentication Flow

1. User registers or logs in.
2. Authentication request sent to backend.
3. Session token stored locally.
4. User redirected to application dashboard.

### Emergency SOS Flow

1. User presses and holds SOS button.
2. Live GPS location is fetched.
3. Trusted contacts are notified.
4. Community SOS request is triggered.
5. Nearby users receive push notifications.
6. Emergency location tracking continues.

### Fake Call Flow

1. User triggers fake call feature.
2. Incoming or outgoing fake call screen appears.
3. Helps users safely exit unsafe situations.

### Check-In Flow

1. User performs safety check-in.
2. Backend verifies check-in request.
3. Safety state is updated.

---

## Backend Integration

SafeHer frontend communicates with a separate backend service.

Backend Repository:

https://github.com/Riddhi-Patil/SafeHer-backend

The backend handles:

* Authentication
* User management
* Location tracking
* Push notification token management
* SOS alert workflows
* Emergency check-ins
* MongoDB data persistence

---

## Screens Explanation

### App.js

Application entry point that manages navigation, themes, stack routing, and app initialization.

### LoginScreen.js & RegisterScreen.js

Handle authentication, validation, and login/register workflows.

### HomeScreen.js

Acts as dashboard and manages SOS triggering and location syncing.

### LiveSOSModal.js

Core emergency workflow including GPS tracking, SMS alerts, and community SOS.

### MapScreen.js

Displays emergency location data visually.

### FakeCallScreen.js

Simulates emergency fake calls.

### ContactsScreen.js

Manages trusted emergency contacts.

### HistoryScreen.js

Displays previously triggered SOS records.

### SplashScreen.js

Routes users based on authentication state.

---

## Setup & Installation

### Clone Repository

```bash
git clone https://github.com/Riddhi-Patil/safeher-2.0.git
cd safeher-2.0
```

### Install Dependencies

```bash
npm install
```

### Run Project

```bash
npx expo start
```

---

## Future Enhancements

* AI-based danger prediction
* Voice-triggered SOS
* Safety heatmaps
* Smart wearable integration
* Offline SOS mode
* AI risk detection system

---

## Challenges Faced

* Real-time location synchronization
* Push notification handling
* Emergency workflow reliability
* Session persistence
* Mobile permissions management

---

## Developed By

Riddhi Bhaskar Patil

---

## License

Developed for educational and academic purposes.

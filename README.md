# FocusDay

[中文说明](./README.zh-CN.md)

FocusDay is a local-first Pomodoro productivity app built with Expo and React Native.
It combines daily task planning, task-bound focus sessions, review analytics, achievements, and date-range task scheduling in a single mobile experience.

## Screenshots

<p align="center">
  <img src="./assets/screenshots/home.png" alt="FocusDay home screen" width="220" />
  <img src="./assets/screenshots/focus.png" alt="FocusDay focus screen" width="220" />
  <img src="./assets/screenshots/stats.png" alt="FocusDay stats screen" width="220" />
  <img src="./assets/screenshots/profile.png" alt="FocusDay profile screen" width="220" />
</p>

## Highlights

- Task-driven Pomodoro workflow instead of a standalone timer
- Daily task board with priority, notes, deadlines, drag sorting, and quick focus start
- Date-range task creation to avoid manually re-adding the same task every day
- Recurring series editing and deletion with `single`, `future`, and `all` scopes
- Focus, short break, and long break cycles with customizable durations
- Local notifications for session completion, including lock-screen reminders
- Daily, weekly, and monthly statistics
- Achievement milestones with unlock progress and prompts
- Local-first persistence powered by AsyncStorage

## Product Scope

FocusDay is designed around one loop:

1. Plan today's work
2. Start a focus session for a specific task
3. Complete Pomodoros and update task progress
4. Review daily output and momentum

This repository currently targets the MVP stage:

- Single-user
- Local storage only
- No cloud sync
- No social or team features

## Tech Stack

- Expo
- React Native
- Expo Router
- TypeScript
- AsyncStorage
- Expo Notifications
- React Native Gesture Handler
- React Native Draggable FlatList

## Project Structure

```text
app/           Expo Router screens
components/    Shared UI components
constants/     Theme and constants
context/       App state and business logic
types/         Shared TypeScript types
utils/         Date, stats, achievements, notifications
scripts/       Local documentation utilities
assets/        App icons, screenshots, and static assets
```

## Getting Started

### Requirements

- Node.js 20+
- npm
- Expo CLI via `npx`

### Install

```bash
npm install
```

### Run in development

```bash
npm start
```

You can also launch specific targets:

```bash
npm run android
npm run ios
npm run web
```

## Build APK

This project is configured for EAS Android preview builds:

```bash
npm run build:apk
```

You need to log in to Expo EAS before building:

```bash
npx eas-cli login
```

## Core Features

### Task Management

- Add, edit, delete, reorder, complete, and reopen tasks
- Set task priority, notes, deadline, and estimated Pomodoros
- Create tasks across a date range
- Edit recurring task series by scope

### Focus Sessions

- Task-bound Pomodoro sessions
- Focus, short break, and long break phases
- Pause, resume, skip break, and early stop
- Completion sheet after each finished focus session
- Local notification reminder when a session ends

### Insights and Motivation

- Today, week, and month stats
- Focus time and completed Pomodoro tracking
- Achievement milestones and unlock prompts
- Streak calculation based on completed focus days

## Current Limitations

- Data is stored locally on device
- No account system or cross-device sync
- No collaborative or social functionality
- No backend or analytics service

## Roadmap

- Cloud backup and multi-device sync
- Repeat rules beyond date ranges
- Richer notification actions
- More achievement tiers and history
- Team or shared focus modes

## Contributing

Issues and pull requests are welcome. If you plan to make a significant change, open an issue first so the scope is clear.

## Status

Active MVP development.

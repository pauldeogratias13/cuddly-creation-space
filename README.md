# NEXUS - The World's First True Super-App

A full-featured super-app with web, Android, and iOS applications built with React, React Native, and Expo EAS Build.

## 🚀 Features

### Core Features
- **Social Feed**: Posts, likes, comments, follows
- **Real-time Chat**: 1-on-1 and group messaging
- **Video Platform**: Upload, stream, and share videos
- **User Profiles**: Customizable profiles with stats
- **Notifications**: Push notifications for all interactions
- **Commerce**: Shopping cart and order management

### Platform Features
- **Web App**: Responsive design with SEO optimization
- **Native Android**: APK with native device APIs
- **Native iOS**: App Store ready with biometric auth
- **Real-time Updates**: Live data synchronization
- **Offline Support**: Caching and offline mode
- **Push Notifications**: Cross-platform notifications

## 🏗️ Architecture

### Monorepo Structure
```
nexus-super-app/
├── apps/
│   ├── web/          # Next.js web application
│   └── mobile/       # React Native + Expo app
├── packages/
│   └── shared/       # Shared types, utilities, and API
├── .github/
│   └── workflows/    # CI/CD pipelines
└── supabase/         # Database schema and migrations
```

### Technology Stack

#### Web App
- **Framework**: Next.js with TanStack Router
- **Styling**: Tailwind CSS with Radix UI
- **State Management**: TanStack Query
- **Database**: Supabase
- **Deployment**: Vercel

#### Mobile App
- **Framework**: React Native + Expo
- **Navigation**: Expo Router
- **Styling**: NativeWind (Tailwind for React Native)
- **State Management**: TanStack Query
- **Build**: Expo EAS Build
- **Deployment**: App Store & Google Play

#### Shared
- **Language**: TypeScript
- **Database Client**: Supabase
- **Utilities**: Date-fns, Custom helpers
- **Types**: Comprehensive type definitions

## 🛠️ Development

### Prerequisites
- Node.js 18+
- pnpm 9+
- GitHub account (for CI/CD)
- Expo account (for mobile builds)

### Setup

1. **Clone and install dependencies**
```bash
git clone <repository-url>
cd nexus-super-app
pnpm install
```

2. **Environment setup**
```bash
# Copy environment template
cp .env.example .env.local

# Fill in your Supabase credentials
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. **Run development servers**
```bash
# Web app
pnpm dev

# Mobile app (requires Expo CLI)
pnpm --filter mobile start
```

### Development Workflow

#### Web Development
```bash
# Start web dev server
pnpm --filter web dev

# Type checking
pnpm --filter web type-check

# Linting
pnpm --filter web lint

# Build
pnpm --filter web build
```

#### Mobile Development
```bash
# Start Expo dev server
pnpm --filter mobile start

# Run on device/simulator
pnpm --filter mobile android
pnpm --filter mobile ios

# Build for testing
pnpm --filter mobile build:android
pnpm --filter mobile build:ios
```

#### Shared Package Development
```bash
# Build shared package
pnpm --filter shared build

# Watch mode
pnpm --filter shared dev
```

## 🚀 Deployment

### Automated CI/CD

This project uses GitHub Actions for automated builds and deployments:

#### Web Deployment
- **Trigger**: Push to `main` branch
- **Build**: Next.js production build
- **Deploy**: Vercel
- **Environment Variables**: Set in GitHub Secrets

#### Mobile Builds
- **Trigger**: Push to `main` branch
- **Android**: Ubuntu runner + EAS Build
- **iOS**: macOS runner + EAS Build
- **Artifacts**: APK/IPA files uploaded as GitHub artifacts

### Manual Deployment

#### Web
```bash
pnpm build:all
# Deploy apps/web/dist to your hosting provider
```

#### Mobile
```bash
# Android
pnpm --filter mobile build:android

# iOS (requires macOS)
pnpm --filter mobile build:ios

# Both platforms
pnpm --filter mobile build:all
```

## 📱 App Stores

### Google Play Store
1. Build APK/AAB using EAS Build
2. Upload to Google Play Console
3. Complete store listing and review

### Apple App Store
1. Build IPA using EAS Build
2. Upload to App Store Connect
3. Complete store listing and review

## 🔐 Environment Variables

### Required Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Expo (for mobile builds)
EXPO_TOKEN=your_expo_token

# EAS Build (for mobile builds)
EAS_BUILD_USERNAME=your_eas_username
EAS_BUILD_PASSWORD=your_eas_password

# iOS (for iOS builds)
APPLE_ID=your_apple_id
APPLE_ID_PASSWORD=your_apple_id_password
APPLE_TEAM_ID=your_apple_team_id

# Vercel (for web deployment)
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id
```

## 🧪 Testing

### Running Tests
```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter web test
pnpm --filter mobile test
```

### Testing Strategy
- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: Supabase test database
- **E2E Tests**: Playwright (web) + Detox (mobile)

## 📊 Monitoring & Analytics

### Error Tracking
- **Sentry**: Integrated for error reporting
- **Crashlytics**: Firebase for mobile crashes

### Analytics
- **Web**: Google Analytics
- **Mobile**: Firebase Analytics

### Performance
- **Web**: Vercel Analytics
- **Mobile**: Expo Analytics

## 🔧 Configuration

### Expo Configuration
Located in `apps/mobile/app.json`:
- App metadata
- Build configuration
- Plugin settings
- Platform-specific options

### EAS Build Configuration
Located in `apps/mobile/eas.json`:
- Build profiles
- Environment variables
- Store submission settings

### Vercel Configuration
Located in `apps/web/vercel.json`:
- Build settings
- Environment variables
- Domain configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

### Code Style
- **ESLint**: Configured for consistent code style
- **Prettier**: Automatic code formatting
- **TypeScript**: Strict type checking
- **Husky**: Pre-commit hooks

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [Expo Documentation](https://docs.expo.dev/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)

### Issues
- Create an issue on GitHub for bugs or feature requests
- Join our Discord community for support

### Community
- Follow us on Twitter: [@nexus](https://twitter.com/nexus)
- Join our Discord: [Invite Link](https://discord.gg/nexus)

---

**Built with ❤️ by the NEXUS team**

# Mind Profiler Application

## Overview

The Mind Profiler is a web application that analyzes writing samples to generate insights about the author's cognitive patterns, reasoning style, and estimated intelligence. The application uses an AI-powered text analysis system with multiple providers to process user submissions and provide detailed cognitive and psychological profiles.

## Recent Changes (October 2025)

1. **Critical Analysis Protocol Overhaul**: Completely rewrote AI analysis system to identify pseudo-intellectual writing:
   - Changed from "evaluate text" to "ANSWER 18 SPECIFIC QUESTIONS" about the text
   - Questions identify: phony jargon, undefined terms, institutional conformity, lack of genuine insight
   - Penalizes academic boilerplate and rewards actual substance
   - Paradigm example: Transcendental empiricism dissertation (scores 28-42 instead of 90+)
   - All 4 providers (DeepSeek, OpenAI, Anthropic, Perplexity) use identical critical protocol
   - **Output Format**: Each question is **numbered and bold** with answers clearly separated
     - Example: **1. IS IT INSIGHTFUL?** followed by explicit answer with quotes
   - **JSON Parsing Fix**: Added "JSON_START" marker to reliably extract structured data from AI responses
     - Prevents parsing errors across all four providers
     - All providers now consistently return formatted analysis with scores

2. **Credit-Based Payment System**: Implemented Stripe payment integration with word-based credits:
   - Users must purchase credits to analyze text
   - Credits are tracked separately per AI provider (Zhi1, Zhi2, Zhi3, Zhi4)
   - Analysis cost calculated by word count
   - Real-time credit deduction during analysis

3. **Special Admin Access**: Username "jmkuczynski" (case-insensitive) has special privileges:
   - Can login without entering a password (password field is optional)
   - Always displays 999,999 credits per provider (unlimited)
   - Account is auto-created on first login if it doesn't exist

4. **Provider Rebranding**: AI provider names in the UI have been rebranded:
   - DeepSeek → Zhi1
   - OpenAI → Zhi2
   - Anthropic → Zhi3
   - Perplexity → Zhi4
   - (Backend LLM integrations remain unchanged)

5. **Real Perplexity Integration**: Implemented actual Perplexity API integration using their sonar-pro model for both cognitive and psychological analysis

6. **Payment Integration**: 
   - Stripe checkout for purchasing credit packages
   - Five price tiers: $5, $10, $25, $50, $100
   - Different word allocations per provider based on API costs
   - Webhook handling for automatic credit fulfillment

7. **CORS and Session Configuration for Cross-Origin Support**:
   - Configured CORS to allow credentials from Replit domain and custom domain (cognitiveprofiler.xyz)
   - Set `trust proxy: 1` for proper HTTPS detection behind Replit's proxy
   - Updated session cookies with `secure: true` and `sameSite: "none"` for cross-origin requests
   - Frontend API client configured with `credentials: "include"` for all requests
   - Ensures session persistence across frontend and backend for authenticated features

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The Cognitive Profiler uses a modern stack with React on the frontend and Express.js on the backend, following a client-server architecture pattern. The application utilizes a PostgreSQL database (via Drizzle ORM) for data persistence. 

The system is structured into distinct layers:
1. **Client Layer**: React-based UI with Tailwind CSS and shadcn/ui components
2. **Server Layer**: Express.js API handling business logic and external API calls
3. **Data Layer**: Drizzle ORM with PostgreSQL integration for data persistence
4. **External Integration**: OpenAI API for cognitive analysis processing

### Frontend Architecture

The frontend is built with React and uses a component-based architecture with a modern, clean UI powered by Tailwind CSS and shadcn/ui components. It implements:

- React hooks for state management and side effects
- React Query for data fetching and caching
- TypeScript for type safety
- Wouter for routing (a lightweight alternative to React Router)
- Responsive design with mobile-first approach

### Backend Architecture

The backend uses Express.js as the API server with TypeScript and follows a modular pattern with clear separation of concerns:

- RESTful API endpoints for frontend interaction
- Middleware for request handling and logging
- Integration with OpenAI API for text analysis
- Data storage via Drizzle ORM

### Database Schema

The database uses Drizzle ORM with a PostgreSQL adapter and includes the following tables:

1. `users` - For authentication and credit tracking
   - id (PK)
   - username (unique)
   - password
   - credits (legacy field)
   - credits_zhi1 (word credits for DeepSeek)
   - credits_zhi2 (word credits for OpenAI)
   - credits_zhi3 (word credits for Anthropic)
   - credits_zhi4 (word credits for Perplexity)

2. `transactions` - For payment tracking
   - id (PK)
   - user_id (FK to users)
   - amount (payment amount in cents)
   - credits (legacy field)
   - credits_zhi1, credits_zhi2, credits_zhi3, credits_zhi4 (credits purchased)
   - provider (single or multi-provider package)
   - stripe_payment_intent_id
   - status (pending/completed/failed)

3. `analysis_requests` - For storing text analysis data
   - id (PK)
   - text (the submitted content)
   - result (the analysis results)
   - created_at (timestamp)

## Key Components

### Client Components

1. **UI Components**: A comprehensive set of reusable UI components from shadcn/ui (buttons, cards, forms, etc.)
2. **Pages**: 
   - Home page with text input and analysis display
   - Error pages
3. **Feature Components**:
   - `IntroSection`: Application introduction
   - `InputSection`: Text submission interface
   - `ProcessingIndicator`: Loading state UI
   - `ResultsSection`: Analysis results display
   - `ErrorSection`: Error handling UI
   - `HelpModal`: Information modal

### Server Components

1. **API Routes**: RESTful endpoints for the frontend
2. **AI Provider Integrations**: Services for text analysis via multiple AI APIs:
   - DeepSeek (deepseek-chat model)
   - OpenAI (gpt-4o model)
   - Anthropic (claude-sonnet-4 model)
   - Perplexity (sonar-pro model, OpenAI-compatible)
3. **Storage**: Data persistence layer with Drizzle ORM
4. **Middleware**: Request processing, logging, error handling

## Data Flow

1. **Text Analysis Flow**:
   - User submits text through frontend
   - Request goes to `/api/analyze-all` endpoint (requires authentication)
   - Server validates the input (min 100 characters)
   - Server calculates word count from text
   - Server checks if user has sufficient credits for all providers
   - If sufficient, server deducts credits before processing
   - Server forwards request to all AI providers in parallel (DeepSeek, OpenAI, Anthropic, Perplexity)
   - Server receives analysis results and returns them with updated credit balances
   - Client renders the analysis results and updates displayed credits
   - (Optional) Results can be stored in the database

2. **Payment Flow**:
   - User clicks "Purchase Credits" button
   - Frontend displays Stripe payment modal with package options
   - User selects package and clicks checkout
   - Frontend calls `/api/create-checkout` to create Stripe session
   - User is redirected to Stripe checkout page
   - After payment, Stripe sends webhook to `/api/webhook/stripe`
   - Server validates webhook, updates transaction status, and adds credits to user account
   - User is redirected back to app with updated credits

3. **Error Handling Flow**:
   - Input validation errors trigger client-side feedback
   - Insufficient credit errors (402 status) show specific provider info
   - API errors are caught and formatted for the client
   - Server-side errors are logged and graceful error responses are returned

## External Dependencies

### Frontend Dependencies

- React and React DOM for UI
- Tailwind CSS for styling
- shadcn/ui for component library
- React Query for data fetching
- Wouter for routing
- Lucide React for icons

### Backend Dependencies

- Express.js for API server
- OpenAI SDK for AI analysis (used for OpenAI and Perplexity)
- Anthropic SDK for Claude analysis
- DeepSeek API for cognitive profiling
- Drizzle ORM for database operations
- Zod for validation

### Development Dependencies

- TypeScript for type safety
- Vite for frontend building and development
- ESBuild for server bundling
- TSX for TypeScript execution

## Deployment Strategy

The application is configured for deployment on Replit with automatic scaling:

1. **Build Process**:
   - Frontend is built with Vite
   - Backend is bundled with ESBuild
   - Output is combined into a single deployment package

2. **Runtime Configuration**:
   - Environment variables for configuration
   - PostgreSQL database via Replit's built-in service
   - Production mode optimizations

3. **Scalability**:
   - Configured for auto-scaling on Replit
   - Stateless application design for horizontal scaling

The application requires the following environment variables:
- `DATABASE_URL`: Connection string for PostgreSQL database
- `OPENAI_API_KEY`: API key for OpenAI services
- `ANTHROPIC_API_KEY`: API key for Anthropic Claude services
- `DEEPSEEK_API_KEY`: API key for DeepSeek services
- `PERPLEXITY_API_KEY`: API key for Perplexity services
- `STRIPE_SECRET_KEY`: Stripe secret key for payment processing
- `STRIPE_PUBLISHABLE_KEY`: Stripe publishable key for frontend
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret for webhook verification
- `STRIPE_WEBHOOK_SECRET_NEWCOGNITIVEPROFILER`: Alternative webhook secret
- `NODE_ENV`: Environment setting (development/production)

## Development Workflow

1. Run `npm run dev` for local development with hot reloading
2. Use `npm run check` to verify TypeScript types
3. Apply database schema changes with `npm run db:push`
4. Build for production with `npm run build`
5. Start production server with `npm run start`
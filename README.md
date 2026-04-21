# Peakform - Athletic Performance Management Platform

A comprehensive web application built with Next.js, TypeScript, Tailwind CSS, and Supabase for managing athletic performance, training, and team collaboration.

## Features

- **Role-based Authentication**: Athletes, Coaches, and Admins with different access levels
- **User Management**: Complete user registration and authentication system
- **Dashboard**: Role-specific dashboards with relevant information
- **Responsive Design**: Modern UI built with Tailwind CSS
- **TypeScript**: Full type safety throughout the application

## Tech Stack

- **Frontend**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Language**: TypeScript
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Peakform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Go to Settings > API to get your Project URL and anon key
   - Create a `profiles` table in your Supabase database:

   ```sql
   CREATE TABLE profiles (
     id uuid REFERENCES auth.users(id) PRIMARY KEY,
     username text UNIQUE,
     full_name text,
     avatar_url text,
     website text,
     role text CHECK (role IN ('athlete', 'coach', 'admin')) NOT NULL DEFAULT 'athlete',
     created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
     updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
   );

   -- Create a function to automatically create a profile when a user signs up
   CREATE OR REPLACE FUNCTION public.handle_new_user()
   RETURNS TRIGGER AS $$
   BEGIN
     INSERT INTO public.profiles (id, full_name, role)
     VALUES (new.id, new.raw_user_meta_data->>'full_name', 'athlete');
     RETURN new;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   -- Create a trigger to call the function when a new user is created
   CREATE TRIGGER on_auth_user_created
     AFTER INSERT ON auth.users
     FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
   ```

4. **Environment Variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── auth/
│   │   ├── login/
│   │   └── signup/
│   ├── dashboard/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   └── supabase.ts
```

## User Roles

### Athlete
- View personal performance stats
- Track training sessions
- View workout schedules
- Communicate with coaches

### Coach
- Manage athletes
- Create training plans
- Monitor athlete progress
- View team analytics

### Admin
- User management
- System overview
- Role management
- System health monitoring

## Authentication Flow

1. Users sign up or log in through the authentication pages
2. Supabase handles authentication and creates user profiles
3. Users are redirected to their role-specific dashboard
4. Authentication state is maintained across the application

## Deployment

### Vercel (Recommended)

1. Push your code to a GitHub repository
2. Connect your repository to Vercel
3. Add your environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms

Ensure your platform supports:
- Node.js 18+
- Environment variables
- Static file serving

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For support, please open an issue in the repository or contact the development team.

## License

This project is licensed under the MIT License.

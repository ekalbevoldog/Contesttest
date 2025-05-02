# Admin Dashboard Spec (v0.1)

## Core Capabilities
- View and manage all user types (business, athlete, compliance)
- Filter by account status, restricted industries, role, onboarding completion
- Manual override on match suggestions
- Flag accounts for compliance review
- Send messages or alerts to users
- Export data (CSV)

## Dashboard Views
1. **User Overview Table**
   - Columns: Name, Role, Email, Status, Created At, Last Login
2. **Business Profiles**
   - View onboarding data, budget, goals, restricted tags
3. **Athlete Profiles**
   - View sport, social links, eligibility, past deals
4. **Compliance Log**
   - See which deals are pending or auto-restricted

## Access
- Restricted to role `admin` via Supabase RLS
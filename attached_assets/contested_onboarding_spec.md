
# Contested: Business Onboarding Flow Spec

## 📌 Purpose
Create a multi-step onboarding flow for *business users* to join the Contested NIL platform. Data must be captured, validated, stored in Supabase, and used to initiate a free trial.

---

## ✅ Technologies Required
- **Frontend**: Framer / React / Next.js
- **Auth**: Supabase Auth (Email + Password)
- **Database**: Supabase PostgreSQL
- **RBAC**: Supabase role tagging (business, athlete, admin, compliance_officer)

---

## 🔐 User Role
```json
{
  "role": "business",
  "access_restriction": "unregulated_athletes_only (if restricted industry)"
}
```

---

## 🧠 Onboarding Flow (Step-by-Step)

```json
[
  {
    "step": "Account Type Selection",
    "field": "account_type_selection",
    "type": "single_select",
    "options": ["Athlete", "Business"],
    "required": true
  },
  {
    "step": "Business Name",
    "field": "business_name",
    "type": "text",
    "required": true
  },
  {
    "step": "Product or Service?",
    "field": "account_type",
    "type": "radio",
    "options": ["Product", "Service"],
    "required": true
  },
  {
    "step": "Industry",
    "field": "industry",
    "type": "dropdown",
    "restricted_industries": ["Cannabis", "Gambling", "Alcohol", "Adult", "Tobacco"],
    "tag_if_restricted": true
  },
  {
    "step": "Goal Identification",
    "field": "goals",
    "type": "multi_select",
    "options": ["Brand Awareness", "Content Creation", "Local Activation", "Event Presence", "Conversion Performance"],
    "required": true
  },
  {
    "step": "Past Partnerships",
    "field": "has_partnered_before",
    "type": "boolean",
    "label": "Have you partnered with athletes before?",
    "required": true
  },
  {
    "step": "Budget Range",
    "field": ["budget_min", "budget_max"],
    "type": "slider_float",
    "min_value": 0,
    "max_value": 100000,
    "required": true
  },
  {
    "step": "Zip Code",
    "field": "zip_code",
    "type": "text",
    "pattern": "\\d{5}",
    "required": true
  },
  {
    "step": "Contact Info",
    "fields": [
      { "name": "contact_name", "type": "text", "required": true },
      { "name": "contact_title", "type": "text", "required": true },
      { "name": "contact_email", "type": "email", "required": true },
      { "name": "business_size", "type": "dropdown", "options": ["1-10", "11-50", "51-200", "201-500", "500+"], "required": true },
      { "name": "phone_number", "type": "tel", "required": false },
      { "name": "password", "type": "password", "required": true }
    ]
  },
  {
    "step": "Start Trial",
    "action": "register_user",
    "integration": "Supabase Auth",
    "redirect": "/account-completion"
  }
]
```

---

## 🗃️ Supabase Table: `businesses`

```sql
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP DEFAULT NOW(),
  account_type TEXT CHECK (account_type IN ('product', 'service')) NOT NULL,
  business_name TEXT NOT NULL,
  restricted_industry BOOLEAN DEFAULT FALSE,
  industry TEXT,
  goals TEXT[],
  haspreviouspartnerships BOOLEAN,
  budgetmin FLOAT,
  budgetmax FLOAT,
  zip VARCHAR(10),
  contact_name TEXT,
  contact_title TEXT,
  contact_email TEXT,
  business_size TEXT,
  phone_number TEXT,
  auth_user_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'trial',
  trial_start_date TIMESTAMP DEFAULT NOW()
);
```

---

## 🧾 Notes

- Supabase Auth handles registration with `contact_email` and `password`.
- Tag restricted industries by checking input against a fixed restricted list.
- Upon registration, tag user metadata as `role: business` in Supabase Auth.
- Begin `/account-completion` flow after onboarding ends.

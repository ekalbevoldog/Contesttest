// Onboarding service to fetch and process JSON step data

// We'll define the structure of our onboarding steps manually
const athleteSteps = [
  {
    "step": "Account Type Selection",
    "field": "account_type_selection",
    "type": "single_select",
    "options": ["Athlete", "Business"],
    "required": true
  },
  {
    "step": "First Name",
    "field": "first_name",
    "type": "text",
    "required": true
  },
  {
    "step": "Last Name",
    "field": "last_name",
    "type": "text",
    "required": true
  },
  {
    "step": "Date of Birth",
    "field": "dob",
    "type": "date",
    "required": true
  },
  {
    "step": "Sport",
    "field": "sport",
    "type": "dropdown",
    "options": ["Football", "Basketball", "Soccer", "Baseball", "Track & Field", "Other"],
    "required": true
  },
  {
    "step": "Position/Role",
    "field": "position",
    "type": "text",
    "required": false
  },
  {
    "step": "University/Organization",
    "field": "university",
    "type": "dropdown",
    "options": ["University of Florida", "Florida State", "UCLA", "University of Michigan", "Ohio State", "Other"],
    "required": true
  },
  {
    "step": "Eligibility Status",
    "field": "eligibility_status",
    "type": "dropdown",
    "options": ["NCAA", "NAIA", "NJCAA", "Other"],
    "required": true
  },
  {
    "step": "Audience Size",
    "field": "audience_size",
    "type": "number",
    "required": true
  },
  {
    "step": "Social Media Handles",
    "field": "social_links",
    "type": "multi_text",
    "required": false
  },
  {
    "step": "Past Brand Deals",
    "field": "has_past_deals",
    "type": "boolean",
    "required": true
  },
  {
    "step": "Preferred Industries",
    "field": "preferred_industries",
    "type": "multi_select",
    "options": ["Fitness", "Fashion", "Food & Beverage", "Tech", "Other"],
    "required": false
  }
];

const businessSteps = [
  {
    "step": "What type of business are you?",
    "field": "business_type",
    "type": "radio",
    "options": ["Product", "Service", "Hybrid"],
    "required": true,
    "description": "Select the primary focus of your business"
  },
  {
    "step": "Industry",
    "field": "industry",
    "type": "dropdown",
    "description": "Select your industry",
    "restricted_industries": ["Cannabis", "Gambling", "Alcohol", "Adult", "Tobacco"],
    "tag_if_restricted": true,
    "result_field": "access_restriction",
    "conditional": {
      "field": "business_type",
      "value": ["Product", "Service", "Hybrid"]
    }
  },
  {
    "step": "Goals with athlete partnerships",
    "field": "goal_identification",
    "type": "multi_select",
    "options": ["Awareness", "Sales / Conversions", "Launch new product", "Athlete ambassadors", "Other"],
    "required": true,
    "description": "What are you hoping to achieve? (Select all that apply)",
    "conditional": {
      "field": "business_type",
      "value": ["Product", "Service", "Hybrid"]
    }
  },
  {
    "step": "Past Partnerships",
    "field": "has_past_partnership",
    "type": "boolean",
    "label": "Have you partnered with athletes before?",
    "required": true,
    "conditional": {
      "field": "business_type",
      "value": ["Product", "Service", "Hybrid"]
    }
  },
  {
    "step": "Budget Range",
    "field": ["budget_min", "budget_max"],
    "type": "slider_float",
    "min_value": 0,
    "max_value": 100000,
    "required": true,
    "description": "What is your estimated monthly budget?",
    "conditional": {
      "field": "business_type",
      "value": ["Product", "Service", "Hybrid"]
    }
  },
  {
    "step": "Business Location",
    "field": "zip_code",
    "type": "text",
    "pattern": "\\d{5}",
    "required": true,
    "description": "What is your business's zip code?",
    "conditional": {
      "field": "business_type",
      "value": ["Product", "Service", "Hybrid"]
    }
  },
  {
    "step": "Operating Locations",
    "field": "operating_location",
    "type": "multi_select",
    "options": ["Neighborhood / Zip", "City", "Region", "Statewide", "National", "Remote / Online"],
    "required": true,
    "description": "Where do you operate? (Select all that apply)",
    "conditional": {
      "field": "business_type",
      "value": "Service"
    }
  },
  {
    "step": "Primary Contact",
    "fields": [
      { "name": "contact_name", "type": "text", "required": true, "label": "Name" },
      { "name": "contact_title", "type": "text", "required": true, "label": "Title" },
      { "name": "contact_email", "type": "email", "required": true, "label": "Email" },
      { "name": "contact_phone", "type": "tel", "required": false, "label": "Phone" }
    ],
    "description": "Who is the primary contact?",
    "conditional": {
      "field": "business_type",
      "value": ["Product", "Service", "Hybrid"]
    }
  },
  {
    "step": "Business Size",
    "field": "business_size",
    "type": "radio",
    "options": ["Sole Proprietor", "Small Team", "Medium", "Enterprise"],
    "required": true,
    "conditional": {
      "field": "business_type",
      "value": ["Product", "Service", "Hybrid"]
    }
  },
  {
    "step": "Business Name",
    "field": "name",
    "type": "text",
    "required": true
  },
  {
    "step": "Create Password",
    "fields": [
      { "name": "password", "type": "password", "required": true }
    ],
    "description": "Create a password to complete your account",
    "action": "register_user",
    "integration": "Supabase Auth",
    "redirect": "/account-completion"
  }
];

export interface OnboardingStep {
  step: string;
  field: string | string[];
  type: string;
  options?: string[] | Array<{id: string, label: string}>;
  required?: boolean;
  description?: string;
  label?: string;
  placeholder?: string;
  tooltip?: string;
  min_value?: number;
  max_value?: number;
  pattern?: string;
  restricted_industries?: string[];
  tag_if_restricted?: boolean;
  result_field?: string; // Field to store the result of an evaluation (like checking restricted industries)
  conditional?: {
    field: string;
    value: string | string[];
  };
  fields?: Array<{
    name: string;
    type: string;
    required: boolean;
    label?: string;
    options?: string[] | Array<{id: string, label: string}>;
  }>;
  action?: string;
  integration?: string;
  redirect?: string;
}

export function getOnboardingSteps(userType: 'athlete' | 'business'): OnboardingStep[] {
  return userType === 'athlete' ? athleteSteps : businessSteps;
}

// Helper to transform the steps for more consistent processing
export function normalizeSteps(steps: OnboardingStep[]): OnboardingStep[] {
  return steps.map(step => {
    // Transform string options into object format
    if (step.options && Array.isArray(step.options) && typeof step.options[0] === 'string') {
      step.options = (step.options as string[]).map(opt => ({
        id: opt.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        label: opt
      }));
    }
    
    // Same for nested fields if present
    if (step.fields) {
      step.fields = step.fields.map(field => {
        if (field.options && Array.isArray(field.options) && typeof field.options[0] === 'string') {
          field.options = (field.options as string[]).map(opt => ({
            id: opt.toLowerCase().replace(/[^a-z0-9]/g, '_'),
            label: opt
          }));
        }
        return field;
      });
    }
    
    return step;
  });
}

// Helper function to check if an industry is restricted
export function isRestrictedIndustry(industry: string, step: OnboardingStep): boolean {
  return step.restricted_industries?.includes(industry) || false;
}

// Process industry selection and set access_restriction
export function processIndustrySelection(industry: string, formData: any, step: OnboardingStep): any {
  const isRestricted = isRestrictedIndustry(industry, step);
  
  // Clone the formData to avoid direct mutation
  const updatedFormData = { ...formData };
  
  // Store the industry selection
  updatedFormData[step.field as string] = industry;
  
  // If this step defines a result field (e.g., access_restriction), set its value
  if (step.result_field) {
    updatedFormData[step.result_field] = isRestricted ? 'restricted' : 'unrestricted';
  }
  
  return updatedFormData;
}

// Generate validation schema for a step
export function getStepValidation(step: OnboardingStep) {
  const rules: Record<string, any> = {};
  
  // Handle different field types
  if (typeof step.field === 'string') {
    rules[step.field] = step.required ? { required: true } : { required: false };
    
    // Add pattern validation if provided
    if (step.pattern) {
      rules[step.field].pattern = new RegExp(step.pattern);
    }
    
    // Add min/max validation for numeric fields
    if (step.type === 'number' || step.type === 'slider_float') {
      if (step.min_value !== undefined) rules[step.field].min = step.min_value;
      if (step.max_value !== undefined) rules[step.field].max = step.max_value;
    }
  } 
  // Handle array field types (like budget range with min/max)
  else if (Array.isArray(step.field)) {
    step.field.forEach(field => {
      rules[field] = step.required ? { required: true } : { required: false };
    });
  }
  
  // Handle nested fields
  if (step.fields) {
    step.fields.forEach(field => {
      rules[field.name] = field.required ? { required: true } : { required: false };
    });
  }
  
  return rules;
}
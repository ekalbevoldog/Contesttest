// List of industries for the dropdown menu
export const industries = [
  { id: 'apparel', label: 'Apparel & Fashion' },
  { id: 'food_beverage', label: 'Food & Beverage' },
  { id: 'technology', label: 'Technology' },
  { id: 'sports_equipment', label: 'Sports Equipment' },
  { id: 'health_wellness', label: 'Health & Wellness' },
  { id: 'beauty', label: 'Beauty & Personal Care' },
  { id: 'entertainment', label: 'Entertainment & Media' },
  { id: 'education', label: 'Education' },
  { id: 'financial', label: 'Financial Services' },
  { id: 'travel', label: 'Travel & Hospitality' },
  { id: 'automotive', label: 'Automotive' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'home_goods', label: 'Home Goods & Decor' },
  { id: 'retail', label: 'Retail' },
  { id: 'real_estate', label: 'Real Estate' },
  { id: 'nonprofit', label: 'Non-profit & Charity' },
  { id: 'ecommerce', label: 'E-commerce' },
  { id: 'professional_services', label: 'Professional Services' },
  { id: 'consumer_packaged_goods', label: 'Consumer Packaged Goods' },
  { id: 'other', label: 'Other' }
];

// Identify restricted industries that need additional compliance review
export const restrictedIndustries = [
  'alcohol',
  'tobacco',
  'vaping',
  'gambling',
  'adult',
  'cannabis',
  'cbd',
  'pharmaceutical'
];

// Function to get industry label by ID
export function getIndustryLabel(id: string): string {
  const industry = industries.find(i => i.id === id);
  return industry ? industry.label : '';
}
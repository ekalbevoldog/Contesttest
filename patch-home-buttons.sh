#!/bin/bash

# Update all CTAs in the pricing section
sed -i '310s|<Link to="/onboarding">Get Started</Link>|<Link to="/find-athlete-match">Find Your Match</Link>|' client/src/pages/Home.tsx
sed -i '360s|<Link to="/onboarding">Get Started</Link>|<Link to="/find-athlete-match">Find Your Match</Link>|' client/src/pages/Home.tsx
sed -i '407s|<Link to="/onboarding">Contact Sales</Link>|<Link to="/find-athlete-match">Contact Sales</Link>|' client/src/pages/Home.tsx
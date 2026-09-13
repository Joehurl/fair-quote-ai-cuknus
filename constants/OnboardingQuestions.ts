export interface OnboardingOption {
  id: string;
  emoji: string;
  label: string;
}

export interface OnboardingQuestion {
  id: string;
  title: string;
  subtitle: string;
  options: OnboardingOption[];
}

export const onboardingQuestions: OnboardingQuestion[] = [
  {
    id: "role",
    title: "What best describes you?",
    subtitle: "We'll tailor your experience to fit your needs",
    options: [
      { id: "homeowner", emoji: "🏠", label: "Homeowner" },
      { id: "renter", emoji: "🔑", label: "Renter" },
      { id: "buyer", emoji: "🏡", label: "First-time buyer" },
      { id: "landlord", emoji: "🏢", label: "Landlord or investor" },
      { id: "business", emoji: "💼", label: "Business owner" },
    ],
  },
  {
    id: "quote_type",
    title: "What kind of quotes do you deal with most?",
    subtitle: "We'll make sure our estimates are relevant to you",
    options: [
      { id: "home_repair", emoji: "🔧", label: "Home repairs & maintenance" },
      { id: "renovation", emoji: "🏗️", label: "Renovations & remodeling" },
      { id: "auto", emoji: "🚗", label: "Auto repairs" },
      { id: "landscaping", emoji: "🌿", label: "Landscaping & outdoor" },
      { id: "other", emoji: "📋", label: "Other services" },
    ],
  },
  {
    id: "pain_point",
    title: "What's your biggest concern with contractor quotes?",
    subtitle: "Help us focus on what matters most to you",
    options: [
      { id: "overcharged", emoji: "💸", label: "Getting overcharged" },
      { id: "quality", emoji: "⭐", label: "Knowing if quality matches price" },
      { id: "compare", emoji: "⚖️", label: "Comparing multiple bids" },
      { id: "negotiate", emoji: "🤝", label: "Negotiating a better deal" },
    ],
  },
  {
    id: "frequency",
    title: "How often do you get contractor quotes?",
    subtitle: "No wrong answer — just helps us understand your needs",
    options: [
      { id: "often", emoji: "📅", label: "Frequently — I have ongoing projects" },
      { id: "sometimes", emoji: "🗓️", label: "A few times a year" },
      { id: "rarely", emoji: "👋", label: "Rarely — I have a specific project" },
      { id: "first", emoji: "🌟", label: "This is my first time" },
    ],
  },
  {
    id: "source",
    title: "How did you hear about FairQuote AI?",
    subtitle: "We'd love to know what brought you here",
    options: [
      { id: "social", emoji: "📱", label: "Social media" },
      { id: "friend", emoji: "👫", label: "Friend or family" },
      { id: "appstore", emoji: "🔍", label: "App Store search" },
      { id: "ad", emoji: "📣", label: "Advertisement" },
    ],
  },
];

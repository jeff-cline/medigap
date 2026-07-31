export const GREETING =
  "Great. Are you looking to buy Medicare insurance? Are you on Medicare looking to save money on life insurance? Or are you just getting ready to retire? Let us know how we can help.";

export const GOV_CONFIRM =
  "We're 1-800-MEDIGAP, a free private service, and we'd be happy to help you save money or connect you with an insurance agent. But based on what you said, it sounds like you're looking for medicare dot gov. Would you like us to text you the appropriate number?";

export const GOV_YES_ACK = "Great, we'll text the appropriate number to you shortly. We have you.";

export const LIFE_PITCH =
  "Would you like to save money on life insurance? The actuarial tables have changed, allowing most of our clients to save 20 to 50 percent on their life insurance.";

export const PHI_PITCH =
  "Did you know there is a new Medigap plan that pays you directly for surprise expenses caused by an accident, cancer, stroke, heart attack, and critical illness? It lets you pay your light bill, lawn care, and life expenses when you need it most, for as low as 29 dollars a month in your age bracket. May I send you information on that as well?";

export const REVERSE_PITCH =
  "Do you have any interest in a reverse mortgage, allowing you to take out needed money to live life?";

export const RETIRE_PITCH =
  "Would you like help from a professional retirement planner to maximize your retirement?";

export const GOODBYE = "Thank you for calling 1-800-MEDIGAP. Goodbye.";

export const PLAN_SS =
  "1-800-MEDIGAP is America's trusted source. If you're looking to start Social Security, you're going to need many of our services in the future, like Medicare insurance, retirement planning, Medicare gap coverage, and more. Right now we think you should start with Social Security. We're happy to text you the appropriate phone number and enroll you in our free notification service, notifying you by text about important dates and opportunities to save time and money and not miss out on time-specific events. Just say yes, let me join, or no. Thanks again for calling 1-800-MEDIGAP.";

export const WHAT_CONTEXT =
  "1-800-MEDIGAP is America's first autonomous voice engine in training, also known as Multi-source Expert Data Intelligence Guidance And Precision — MEDIGAP GPT — and we're here to serve you as best we can as we grow. We may be going through periods where we don't have professionals already onboarded. Please listen to the following list and let us know how we can help.";

export const CUSTOMER_SERVICE_CONTEXT =
  "1-800-MEDIGAP is America's first autonomous voice engine in training, also known as Multi-source Expert Data Intelligence Guidance And Precision — MEDIGAP GPT — and we're here to serve you as best we can as we grow. We may be going through periods where we don't have professionals already onboarded. Please listen to the following list, pick from the list, and we'll transfer you to the customer service person best suited to your needs.";

export function transferScript(moneyWord: string): string {
  return `Great — transferring you to a ${moneyWord} professional now. Thank you for calling 1-800-MEDIGAP. We'll text you the information you need and connect you with a professional who handles ${moneyWord}.`;
}

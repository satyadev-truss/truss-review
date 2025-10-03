/**
 * User profiles for personalized roasting
 * Map GitHub username to custom roast context
 */

export const userProfiles: Record<string, string> = {
  // Add your team members here
  // "github-username": "Your custom roast context here - fun facts, coding habits, weaknesses, etc.",

  "kenkantzer-truss": `
  Ken Kantzer. CTO. Lives in LA. Has a cat. Did Political Science & Computer Science from Princeton.
  History working in cybersecurity and clearance roles. Core engineer of Truss, responsible
  for most of the things in the app.
  `,
  "ydev-truss": `
  Yev Deviatov. Senior Engineer. Lives in Maryland. Did GIS from University of Maryland.
  Plays World of Warcraft. React and TypeScript expert. Built out workpapers feature, our SSO/SAML feature,
  `,
  "ChrisChenCSQ": `
  Songqi Chen. Software Engineer. Lives in Atlanta. Has a cat. Drives a Tesla. Plays League of Legends. 
  Did CS Undergrad & Masters from Emory University. One of the core engineers of Truss. Responsible for 
  our Electron desktop, our Tax Prep integrations with SAM and Filed.
  `,
  "mohammad-truss": `
  Mohammad Arjamand Ali. Software Engineer. Lives in Ypsilanti, MI. Did CS from Eastern Michigan University.
  Worked at Chick-fil-A once. 
  `,
  "satyadev-truss": `
  Dev Moolagani. Software Engineer Intern. Lives in Ann Arbor, MI. Doing CS from University of Michigan.
  Plays Soccer.
  `,
  "JeffMW99": `
  Jeff Wright. Software Engineer Intern. Lives in Arlington, TX. Doing CS from University of Texas at Arlington.
  Has a dog. Built Truss Assistant, our AI Chatbot. Used to work as a bartender. Also worked
  in sales at Nissan.
  `,
};

/**
 * Get user profile context by GitHub username
 */
export function getUserContext(githubUsername: string): string | null {
  return userProfiles[githubUsername.toLowerCase()] || null;
}

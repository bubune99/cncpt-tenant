// Admin configuration
// Add admin emails here to grant admin access

export const ADMIN_EMAILS = [
  'bubuneo99@gmail.com',
  // Add more admin emails below as needed
];

// Temporary admin mode for testing
// Set this to true to allow ANY authenticated user to access admin features
const ALLOW_ALL_USERS_AS_ADMIN = false;

export function isAdminUser(email: string | null | undefined): boolean {
  if (!email) return false;
  
  if (ALLOW_ALL_USERS_AS_ADMIN) {
    return true;
  }
  
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export function getAdminConfig() {
  return {
    adminEmails: ADMIN_EMAILS,
    features: {
      businessOwnerManagement: true,
      customerManagement: true,
      designerManagement: true,
      analyticsAccess: true,
      systemConfiguration: true,
    }
  };
}
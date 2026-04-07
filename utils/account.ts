import { deleteUserAccount as deleteSupabaseData } from "@/utils/supabase-helpers"

// Comprehensive account deletion that handles both Supabase and Clerk
export const permanentlyDeleteAccount = async (userId: string, userObject: any) => {
  console.log("Starting permanent account deletion for user:", userId)

  try {
    // Step 1: Delete all user data from Supabase first
    console.log("Deleting user data from Supabase...")
    await deleteSupabaseData(userId)

    // Step 2: Delete the account from Clerk
    console.log("Deleting account from Clerk...")
    await userObject.delete()

    console.log("Account deletion completed successfully")
    return {
      success: true,
      message: "Your account has been permanently deleted. All your data has been removed.",
    }

  } catch (error: any) {
    console.error("Account deletion failed:", error)

    // If Supabase deletion succeeded but Clerk failed, we have a partial deletion
    // This is a critical error that should be handled carefully
    return {
      success: false,
      message: error.message || "Account deletion failed. Please contact support.",
      partial: true, // Indicates partial deletion occurred
    }
  }
}
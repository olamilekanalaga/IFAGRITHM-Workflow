import SignIn from "@/components/sign-in";
import { configured } from "@/lib/supabase/config";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <SignIn
      configured={configured()}
      initialError={
        params.error
          ? "Google sign-in was not completed. Please try again."
          : ""
      }
    />
  );
}

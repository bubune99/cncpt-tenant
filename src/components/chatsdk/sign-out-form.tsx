"use client";

import { useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";

export const SignOutForm = () => {
  const user = useUser();
  const router = useRouter();

  const handleSignOut = async () => {
    await user?.signOut();
    router.push("/");
  };

  return (
    <button
      className="w-full px-1 py-0.5 text-left text-red-500"
      type="button"
      onClick={handleSignOut}
    >
      Sign out
    </button>
  );
};

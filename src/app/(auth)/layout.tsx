import { Logo } from "@/components/layout/Logo";
import { SupabaseSetupBanner } from "@/components/auth/SupabaseSetupBanner";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F9F9F8] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 flex justify-center">
          <Logo href="/" />
        </div>
        <SupabaseSetupBanner />
        {children}
      </div>
    </div>
  );
}

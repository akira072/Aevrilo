import Link from "next/link";
import { AevriloLogo } from "@/components/brand/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="space-y-3">
            <AevriloLogo href="/" size="md" showTagline />
            <p className="text-sm leading-relaxed text-slate-600">
              Student innovation and creative talent marketplace built for Indian campuses and emerging creators.
            </p>
            <p className="text-xs text-slate-500">
              INR accounting · Zero freelancer joining fee · 5% transparent platform fee on completed projects.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900">CREATE Marketplace</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li><Link href="/explore" className="hover:text-slate-950">Explore Projects</Link></li>
              <li><Link href="/freelancers" className="hover:text-slate-950">Explore Freelancers</Link></li>
              <li><Link href="/requests/new" className="hover:text-slate-950">Post a Request</Link></li>
              <li><Link href="/portfolio" className="hover:text-slate-950">Showcase Portfolio</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900">COMPETE Ecosystem</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li><Link href="/hackathons" className="hover:text-slate-950">Browse Hackathons</Link></li>
              <li><Link href="/hackathons/create" className="hover:text-slate-950">Host a Hackathon</Link></li>
              <li><Link href="/dashboard" className="hover:text-slate-950">Team & Submissions</Link></li>
              <li><Link href="/payments" className="hover:text-slate-950">Prizes & Payout Records</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900">Platform & Support</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li><Link href="/about" className="hover:text-slate-950">About Aevrilo</Link></li>
              <li><Link href="/contact" className="hover:text-slate-950">Contact & Support</Link></li>
              <li><Link href="/about#policies" className="hover:text-slate-950">Marketplace & Payment Policy</Link></li>
              <li><Link href="/about#privacy" className="hover:text-slate-950">Privacy & Safety</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-slate-100 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Aevrilo. Built for student creators, builders, and organizers.</p>
          <div className="flex items-center gap-4">
            <Link href="/about#policies" className="hover:text-slate-800">Terms</Link>
            <Link href="/about#privacy" className="hover:text-slate-800">Privacy</Link>
            <Link href="/contact" className="hover:text-slate-800">Report Abuse</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

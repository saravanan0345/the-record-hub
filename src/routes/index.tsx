import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, Mail, MessageCircle, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { RequestForm } from "@/components/RequestForm";
import { Reviews } from "@/components/Reviews";
import { OWNER, SERVICES, WHATSAPP_CHAT_LINK } from "@/lib/services";
import logo from "@/assets/record-hub-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Record Hub | Student Record, Assignment & Project Services" },
      {
        name: "description",
        content:
          "Affordable, student-friendly record writing, assignments, projects, PPTs, posters, resumes and website making. Your Work. Our Support. One Hub.",
      },
      { property: "og:title", content: "The Record Hub — Your Work. Our Support. One Hub." },
      {
        property: "og:description",
        content:
          "Student-friendly academic and digital services at affordable, low-budget pricing.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <WhatsAppFab />

      {/* Hero */}
      <section id="home" className="surface-glow relative overflow-hidden pt-32 pb-20 sm:pt-40">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <img
            src={logo}
            alt="The Record Hub logo"
            className="animate-rise mx-auto h-28 w-28 object-contain sm:h-36 sm:w-36"
          />
          <h1 className="animate-rise mt-8 text-4xl font-extrabold sm:text-6xl">
            THE RECORD <span className="text-brand-gradient">HUB</span>
          </h1>
          <p className="animate-rise mt-5 text-xl font-semibold text-accent sm:text-2xl">
            Your Work. Our Support. One Hub.
          </p>
          <p className="animate-rise mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Student-friendly academic and digital services at affordable, low-budget pricing.
          </p>
          <div className="animate-rise mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#request"
              className="bg-brand-gradient w-full rounded-full px-8 py-4 text-base font-semibold text-primary-foreground shadow-elegant transition-transform hover:scale-105 sm:w-auto"
            >
              Get Our Services
            </a>
            <a
              href="#services"
              className="w-full rounded-full border border-border px-8 py-4 text-base font-semibold transition-colors hover:bg-secondary sm:w-auto"
            >
              Explore Services
            </a>
          </div>
          <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-5 py-2 text-xs font-medium tracking-wide text-muted-foreground">
            <Sparkles className="size-4 text-accent" />
            Affordable • Student-Friendly • Reliable
          </p>
        </div>
      </section>

      {/* About */}
      <section id="about" className="border-t border-border py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-3xl font-bold sm:text-4xl">About The Record Hub</h2>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              The Record Hub is a student-focused service platform created to make academic and
              digital work easier. We provide affordable, reliable and student-friendly services
              including record writing, assignment support, project assistance and website
              development.
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Our goal is simple — to provide quality work at a budget-friendly price while saving
              students valuable time.
            </p>
            <div className="mt-7 rounded-2xl border border-border bg-card p-5">
              <p className="text-xs tracking-widest text-muted-foreground uppercase">
                Founder &amp; Owner
              </p>
              <p className="mt-1 text-lg font-semibold">{OWNER.name}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: Wallet, title: "Low Budget", text: "Pricing built around student pockets." },
              { icon: ShieldCheck, title: "Reliable", text: "On-time delivery, every request." },
              { icon: Sparkles, title: "Quality Work", text: "Neat, well-presented output." },
              { icon: MessageCircle, title: "1 Hour Reply", text: "We respond fast on WhatsApp." },
            ].map((f) => (
              <div
                key={f.title}
                className="card-hover rounded-2xl border border-border bg-card p-5"
              >
                <f.icon className="size-6 text-primary" />
                <p className="mt-3 font-semibold">{f.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="border-t border-border py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">Our Services</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
            Everything a student needs — handled in one hub.
          </p>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((s) => (
              <article
                key={s.id}
                className="card-hover rounded-2xl border border-border bg-card p-6"
              >
                <span className="text-3xl">{s.icon}</span>
                <h3 className="mt-4 text-lg font-semibold">{s.id}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Made for students */}
      <section className="border-t border-border py-20">
        <div className="surface-glow mx-auto max-w-4xl rounded-3xl border border-border bg-card px-6 py-14 text-center shadow-soft sm:px-12">
          <h2 className="text-3xl font-bold sm:text-4xl">Made for Students</h2>
          <p className="mt-5 text-lg font-medium text-accent">
            Quality service doesn&apos;t have to be expensive.
          </p>
          <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-muted-foreground">
            The Record Hub provides low-budget, student-friendly services designed to fit your
            academic needs and budget.
          </p>
          <a
            href="#request"
            className="bg-brand-gradient mt-9 inline-block rounded-full px-8 py-4 text-base font-semibold text-primary-foreground shadow-elegant transition-transform hover:scale-105"
          >
            Request a Service
          </a>
        </div>
      </section>

      {/* Request form */}
      <section id="request" className="border-t border-border py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">Request a Service</h2>
          <p className="mx-auto mt-3 mb-12 max-w-xl text-center text-muted-foreground">
            Fill in your details and we&apos;ll contact you within 1 hour.
          </p>
          <RequestForm />
        </div>
      </section>

      {/* Customer Reviews */}
      <Reviews />

      {/* Contact */}
      <section id="contact" className="border-t border-border py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold sm:text-4xl">Get In Touch</h2>
          <div className="mt-8 rounded-3xl border border-border bg-card p-8 text-left shadow-soft">
            <p className="font-display text-xl font-bold">The Record Hub</p>
            <p className="mt-3 text-sm text-muted-foreground">Owner: {OWNER.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">Email: {OWNER.email}</p>
            <p className="mt-1 text-sm text-muted-foreground">WhatsApp: {OWNER.whatsappDisplay}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href={`mailto:${OWNER.email}`}
                className="bg-brand-gradient flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
              >
                <Mail className="size-4" /> Email Us
              </a>
              <a
                href={WHATSAPP_CHAT_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold transition-colors hover:bg-secondary"
              >
                <MessageCircle className="size-4" /> WhatsApp Us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-14">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <img src={logo} alt="" className="h-10 w-10 object-contain" />
              <span className="font-display font-bold">The Record Hub</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Your Work. Our Support. One Hub.</p>
          </div>
          <div>
            <p className="font-semibold">Services</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {[
                "Record Writing",
                "Assignment Writing",
                "Project Assistance",
                "Website Making",
                "PPT & Documentation",
                "Resume / Portfolio",
              ].map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold">Contact</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <a href={`mailto:${OWNER.email}`} className="hover:text-foreground">
                  {OWNER.email}
                </a>
              </li>
              <li>
                <a
                  href={WHATSAPP_CHAT_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground"
                >
                  {OWNER.whatsappDisplay}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center gap-3">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Lock className="size-3.5" /> Admin Login
          </Link>
          <p className="text-center text-xs text-muted-foreground">
            © 2026 The Record Hub. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

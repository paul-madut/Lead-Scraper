"use client";

import { useState, useEffect, type FormEvent } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  Phone,
  Mail,
  Menu,
  X,
  Check,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Contact", href: "#contact" },
];

const features = [
  {
    title: "Smart lead discovery",
    description:
      "Find local businesses that need your services by keyword and location, drawn straight from Google Places.",
    icon: Search,
  },
  {
    title: "Quality filtering",
    description:
      "See ratings, review counts, and business status so you can focus on the prospects most worth your time.",
    icon: CheckCircle2,
  },
  {
    title: "Contact data included",
    description:
      "Every lead ships with phone, website, and map links so you can reach the right person fast.",
    icon: Phone,
  },
  {
    title: "One-click CSV export",
    description:
      "Send qualified leads straight into your CRM or outreach tool with a clean, ready-to-use export.",
    icon: Mail,
  },
];

const steps = [
  {
    step: "1",
    title: "You search",
    description:
      "Pick a business type and a location. We query Google Places for matching businesses in the area.",
  },
  {
    step: "2",
    title: "We qualify",
    description:
      "Each lead comes with rating, review count, and status so low-quality prospects are easy to skip.",
  },
  {
    step: "3",
    title: "We enrich",
    description:
      "Phone numbers, websites, and map links are attached to every result, ready for outreach.",
  },
  {
    step: "4",
    title: "You connect",
    description:
      "Export to CSV or work leads from your dashboard. You only pay for new leads, never duplicates.",
  },
];

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Agency Owner",
    company: "PixelPerfect Design",
    quote:
      "It transformed our outreach process. We've seen a 3x increase in qualified leads with minimal effort.",
  },
  {
    name: "Michael Torres",
    role: "Freelance Developer",
    company: "CodeCraft",
    quote:
      "As a solo developer, finding clients was my biggest struggle. Now I have a steady stream of leads that actually need my services.",
  },
  {
    name: "Jennifer Liu",
    role: "Marketing Director",
    company: "WebWizards Agency",
    quote:
      "The quality of leads is remarkable. Our sales team loves that they arrive pre-qualified and ready for a conversation.",
  },
];

const plans = [
  {
    name: "Starter",
    price: "$99",
    period: "per month",
    description: "Perfect for freelancers and solopreneurs.",
    features: [
      "50 qualified leads monthly",
      "Full contact information",
      "CSV export",
      "Search history",
    ],
    cta: "Get started",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "$249",
    period: "per month",
    description: "Ideal for small agencies and growing teams.",
    features: [
      "150 qualified leads monthly",
      "Full contact information",
      "Duplicate-free re-searches",
      "Priority email support",
    ],
    cta: "Get started",
    highlighted: true,
  },
  {
    name: "Agency",
    price: "$499",
    period: "per month",
    description: "For established agencies with multiple clients.",
    features: [
      "500 qualified leads monthly",
      "Advanced targeting",
      "Bulk CSV export",
      "Dedicated account manager",
    ],
    cta: "Contact sales",
    highlighted: false,
  },
];

const faqs = [
  {
    question: "How does the lead search work?",
    answer:
      "You choose a business type and a location, and we query Google Places for matching local businesses. Each result includes contact details and quality signals like rating and review count.",
  },
  {
    question: "Do I pay for duplicate leads?",
    answer:
      "No. Re-searching the same area only surfaces businesses you haven't seen before, and you are only charged for new leads - never duplicates.",
  },
  {
    question: "Can I target specific industries or locations?",
    answer:
      "Yes. Every search is scoped by business type, location, and radius, so you only receive leads that match your ideal client profile.",
  },
  {
    question: "How many leads can I get each month?",
    answer:
      "It depends on your plan. Starter includes 50 qualified leads monthly, Growth offers 150, and Agency delivers 500. Custom plans are available for larger needs.",
  },
  {
    question: "Can I export leads to my CRM?",
    answer:
      "Yes. Every result set can be exported to a clean CSV that imports into HubSpot, Pipedrive, Salesforce, or any tool that accepts CSV.",
  },
];

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleContactSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "");
    const email = String(data.get("email") ?? "");
    const subject = String(data.get("subject") ?? "");
    const message = String(data.get("message") ?? "");
    const body = `From: ${name} <${email}>\n\n${message}`;
    window.location.href = `mailto:hello@b2lead.com?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "border-b bg-background/80 py-2 backdrop-blur-md"
            : "border-b border-transparent bg-transparent py-4"
        }`}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold tracking-tight text-primary">
              B2Lead
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden items-center gap-8 md:flex">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="hidden items-center gap-2 md:flex">
              <Button asChild variant="ghost" size="sm">
                <Link href="/auth">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/auth">Get started</Link>
              </Button>
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Toggle menu"
              onClick={() => setIsMenuOpen((open) => !open)}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 overflow-hidden md:hidden"
            >
              <nav className="flex flex-col gap-3 pb-4">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                ))}
                <div className="flex flex-col gap-2 pt-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/auth">Sign in</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/auth">Get started</Link>
                  </Button>
                </div>
              </nav>
            </motion.div>
          )}
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-accent/40 to-background pt-32 pb-20 md:pt-36 md:pb-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center gap-12 md:flex-row">
              <div className="md:w-1/2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Badge variant="secondary" className="mb-5">
                    Local business leads on demand
                  </Badge>
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="mb-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl"
                >
                  Your pipeline,
                  <br />
                  <span className="text-primary">always full</span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="mb-8 max-w-xl text-lg text-muted-foreground"
                >
                  B2Lead finds qualified local business leads for web designers
                  and developers - complete with contact details, and you only
                  pay for the ones you haven&apos;t seen before.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="flex flex-col gap-3 sm:flex-row"
                >
                  <Button asChild size="lg">
                    <Link href="/auth">
                      Start free trial
                      <ArrowRight />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <a href="#how-it-works">See how it works</a>
                  </Button>
                </motion.div>
              </div>

              <div className="md:w-1/2">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                >
                  <Card className="overflow-hidden p-0">
                    <div className="flex aspect-[4/3] items-center justify-center bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/image.png"
                        alt="B2Lead dashboard preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </Card>
                </motion.div>
              </div>
            </div>

            {/* Stats */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="mt-16 grid grid-cols-1 gap-6 md:mt-24 md:grid-cols-3"
            >
              {[
                { value: "8.5x", label: "Average ROI for agencies on the platform" },
                { value: "35k+", label: "Qualified leads delivered every month" },
                { value: "92%", label: "Customer satisfaction rating" },
              ].map((stat) => (
                <motion.div key={stat.value} variants={fadeIn}>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="mb-1 text-4xl font-bold text-primary">
                        {stat.value}
                      </div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="mx-auto mb-14 max-w-2xl text-center"
            >
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                Everything you need to fill your pipeline
              </h2>
              <p className="text-lg text-muted-foreground">
                Discover, qualify, and export potential clients for your web
                design and development services.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeIn}
                  >
                    <Card className="h-full transition-shadow hover:shadow-md">
                      <CardHeader>
                        <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                          <Icon className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                        <CardDescription>{feature.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="bg-muted/40 py-20">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="mx-auto mb-14 max-w-2xl text-center"
            >
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                How B2Lead works
              </h2>
              <p className="text-lg text-muted-foreground">
                A simple four-step flow that brings qualified leads to your
                dashboard.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {steps.map((item) => (
                <motion.div
                  key={item.step}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-80px" }}
                  variants={fadeIn}
                >
                  <Card className="h-full">
                    <CardHeader>
                      <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                        {item.step}
                      </div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="mt-14 text-center"
            >
              <Button asChild size="lg">
                <Link href="/auth">
                  Start finding leads
                  <ArrowRight />
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-20">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="mx-auto mb-14 max-w-2xl text-center"
            >
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                What our customers say
              </h2>
              <p className="text-lg text-muted-foreground">
                Join hundreds of web professionals who have grown their business
                with B2Lead.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {testimonials.map((testimonial) => (
                <motion.div
                  key={testimonial.name}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeIn}
                >
                  <Card className="h-full">
                    <CardContent className="pt-6">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                          {initials(testimonial.name)}
                        </div>
                        <div>
                          <div className="font-semibold">{testimonial.name}</div>
                          <p className="text-sm text-muted-foreground">
                            {testimonial.role}, {testimonial.company}
                          </p>
                        </div>
                      </div>
                      <blockquote className="text-muted-foreground">
                        &ldquo;{testimonial.quote}&rdquo;
                      </blockquote>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="bg-muted/40 py-20">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="mx-auto mb-14 max-w-2xl text-center"
            >
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                Simple, transparent pricing
              </h2>
              <p className="text-lg text-muted-foreground">
                Choose the plan that fits your business. No long-term contracts,
                cancel anytime.
              </p>
            </motion.div>

            <div className="mx-auto grid max-w-5xl grid-cols-1 items-start gap-6 md:grid-cols-3">
              {plans.map((plan) => (
                <motion.div
                  key={plan.name}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeIn}
                >
                  <Card
                    className={
                      plan.highlighted
                        ? "relative border-primary shadow-md ring-1 ring-primary"
                        : "h-full"
                    }
                  >
                    <CardHeader>
                      {plan.highlighted && (
                        <Badge className="absolute -top-3 left-6">Most popular</Badge>
                      )}
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-foreground">
                          {plan.price}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {plan.period}
                        </span>
                      </div>
                      <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="mb-6 space-y-3">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2 text-sm">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <span className="text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        asChild
                        className="w-full"
                        variant={plan.highlighted ? "default" : "outline"}
                      >
                        <Link href="/auth">{plan.cta}</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="mt-10 text-center text-sm text-muted-foreground"
            >
              <p>
                Need a custom solution?{" "}
                <a href="#contact" className="font-medium text-primary hover:underline">
                  Contact our sales team
                </a>
              </p>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="mx-auto max-w-4xl rounded-2xl bg-primary px-6 py-14 text-center text-primary-foreground md:px-12"
            >
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                Ready to fill your sales pipeline?
              </h2>
              <p className="mx-auto mb-8 max-w-xl text-lg text-primary-foreground/80">
                Get started with a 14-day free trial. No credit card required.
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" variant="secondary">
                  <Link href="/auth">
                    Start free trial
                    <ArrowRight />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                  <a href="#pricing">View pricing</a>
                </Button>
              </div>
              <p className="mt-6 text-sm text-primary-foreground/70">
                By signing up, you agree to our Terms of Service and Privacy Policy.
              </p>
            </motion.div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="mx-auto mb-14 max-w-2xl text-center"
            >
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                Frequently asked questions
              </h2>
              <p className="text-lg text-muted-foreground">
                Everything you need to know about B2Lead.
              </p>
            </motion.div>

            <div className="mx-auto max-w-3xl divide-y divide-border">
              {faqs.map((item) => (
                <motion.div
                  key={item.question}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeIn}
                  className="py-6"
                >
                  <h3 className="mb-2 text-lg font-semibold">{item.question}</h3>
                  <p className="text-muted-foreground">{item.answer}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="bg-muted/40 py-20">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="mx-auto mb-14 max-w-2xl text-center"
            >
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                Get in touch
              </h2>
              <p className="text-lg text-muted-foreground">
                Have questions? Our team is here to help you get started.
              </p>
            </motion.div>

            <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                className="space-y-6"
              >
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Email</p>
                    <a
                      href="mailto:hello@b2lead.com"
                      className="text-muted-foreground transition-colors hover:text-primary"
                    >
                      hello@b2lead.com
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <a
                      href="tel:+18005551234"
                      className="text-muted-foreground transition-colors hover:text-primary"
                    >
                      +1 (800) 555-1234
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Office</p>
                    <p className="text-muted-foreground">
                      123 Tech Lane, Suite 500
                      <br />
                      San Francisco, CA 94107
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Send us a message</CardTitle>
                    <CardDescription>
                      We&apos;ll open your email client with the details filled in.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleContactSubmit} className="space-y-4">
                      <div className="space-y-1.5">
                        <label htmlFor="name" className="text-sm font-medium">
                          Name
                        </label>
                        <Input id="name" name="name" required />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="email" className="text-sm font-medium">
                          Email
                        </label>
                        <Input id="email" name="email" type="email" required />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="subject" className="text-sm font-medium">
                          Subject
                        </label>
                        <Input id="subject" name="subject" required />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="message" className="text-sm font-medium">
                          Message
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          rows={4}
                          required
                          className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px]"
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        Send message
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 text-2xl font-bold text-primary">B2Lead</div>
              <p className="mb-4 max-w-xs text-sm text-muted-foreground">
                Local business lead generation for web design and development
                professionals.
              </p>
              <p className="text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} B2Lead. All rights reserved.
              </p>
            </div>

            {[
              {
                title: "Product",
                links: [
                  { label: "Features", href: "#features" },
                  { label: "Pricing", href: "#pricing" },
                  { label: "How it works", href: "#how-it-works" },
                ],
              },
              {
                title: "Resources",
                links: [
                  { label: "Blog", href: "#" },
                  { label: "Documentation", href: "#" },
                  { label: "Support", href: "#contact" },
                ],
              },
              {
                title: "Company",
                links: [
                  { label: "About", href: "#" },
                  { label: "Privacy", href: "#" },
                  { label: "Terms", href: "#" },
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <h3 className="mb-4 text-sm font-semibold">{col.title}</h3>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 text-sm text-muted-foreground md:flex-row">
            <p>Built for web professionals.</p>
            <div className="flex gap-6">
              <a href="#" className="transition-colors hover:text-foreground">
                Privacy Policy
              </a>
              <a href="#" className="transition-colors hover:text-foreground">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

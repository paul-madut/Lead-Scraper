"use client";
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6 }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const pulse = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeInOut"
    }
  }
};

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Features data
  const features = [
    {
      title: "Smart Lead Discovery",
      description: "Our AI-powered engine finds businesses that need web design services by analyzing multiple signals.",
      icon: "🔍"
    },
    {
      title: "Quality Filtering",
      description: "We filter leads based on budget potential, tech stack, and likelihood of conversion.",
      icon: "✅"
    },
    {
      title: "Contact Data Enrichment",
      description: "Get direct email addresses and phone numbers of decision-makers to reach the right person.",
      icon: "📞"
    },
    {
      title: "Automated Outreach",
      description: "Connect with your email marketing tools for seamless follow-up campaigns.",
      icon: "📧"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Agency Owner",
      company: "PixelPerfect Design",
      quote: "B2Lead transformed our outreach process. We've seen a 3x increase in qualified leads with minimal effort.",
      avatar: "/api/placeholder/50/50"
    },
    {
      name: "Michael Torres",
      role: "Freelance Developer",
      company: "CodeCraft",
      quote: "As a solo developer, finding clients was my biggest struggle. B2Lead gives me a steady stream of leads that actually need my services.",
      avatar: "/api/placeholder/50/50"
    },
    {
      name: "Jennifer Liu",
      role: "Marketing Director",
      company: "WebWizards Agency",
      quote: "The quality of leads from B2Lead is remarkable. Our sales team loves that they're pre-qualified and ready for conversation.",
      avatar: "/api/placeholder/50/50"
    }
  ];
  
  // Pricing plans
  const plans = [
    {
      name: "Starter",
      price: "$99",
      period: "per month",
      description: "Perfect for freelancers and solopreneurs",
      features: [
        "50 qualified leads monthly",
        "Basic contact information",
        "Email templates",
        "Weekly updates"
      ],
      cta: "Start Free Trial",
      highlighted: false
    },
    {
      name: "Growth",
      price: "$249",
      period: "per month",
      description: "Ideal for small agencies and growing teams",
      features: [
        "150 qualified leads monthly",
        "Complete contact information",
        "Custom filters and preferences",
        "CRM integration",
        "Email & phone support"
      ],
      cta: "Start Free Trial",
      highlighted: true
    },
    {
      name: "Agency",
      price: "$499",
      period: "per month",
      description: "For established agencies with multiple clients",
      features: [
        "500 qualified leads monthly",
        "Premium data enrichment",
        "Advanced targeting options",
        "White-labeled reports",
        "Dedicated account manager",
        "API access"
      ],
      cta: "Contact Sales",
      highlighted: false
    }
  ];

  return (
    <div className="font-sans min-h-screen">
      <Head>
        <title>B2Lead - Lead Generation for Web Design & Development Professionals</title>
        <meta name="description" content="Generate qualified leads for your web design or development business with B2Lead's AI-powered prospecting tool." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Navigation */}
      <header className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'}`}>
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="text-2xl font-bold text-blue-600"
              >
                B2Lead
              </motion.div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-8">
              <motion.nav className="flex items-center space-x-8" initial="hidden" animate="visible" variants={staggerContainer}>
                <motion.a variants={fadeIn} href="#features" className="text-gray-700 hover:text-blue-600 transition-colors">Features</motion.a>
                <motion.a variants={fadeIn} href="#how-it-works" className="text-gray-700 hover:text-blue-600 transition-colors">How It Works</motion.a>
                <motion.a variants={fadeIn} href="#pricing" className="text-gray-700 hover:text-blue-600 transition-colors">Pricing</motion.a>
                <motion.a variants={fadeIn} href="#testimonials" className="text-gray-700 hover:text-blue-600 transition-colors">Testimonials</motion.a>
                <motion.a variants={fadeIn} href="#contact" className="text-gray-700 hover:text-blue-600 transition-colors">Contact</motion.a>
              </motion.nav>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Link href="/auth" className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">Sign Up Free</Link>
              </motion.div>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700 focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
          
          {/* Mobile menu */}
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0.5, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="md:hidden mt-4 pb-4 bg-white/70"
            >
              <nav className="flex flex-col space-y-4">
                <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors">Features</a>
                <a href="#how-it-works" className="text-gray-700 hover:text-blue-600 transition-colors">How It Works</a>
                <a href="#pricing" className="text-gray-700 hover:text-blue-600 transition-colors">Pricing</a>
                <a href="#testimonials" className="text-gray-700 hover:text-blue-600 transition-colors">Testimonials</a>
                <a href="#contact" className="text-gray-700 hover:text-blue-600 transition-colors">Contact</a>
                <Link href="/auth" className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors text-center">Sign Up Free</Link>
              </nav>
            </motion.div>
          )}
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="pt-28 pb-20 md:pt-32 md:pb-24 bg-gradient-to-br from-white to-blue-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 mb-12 md:mb-0">
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900"
                >
                  Your Pipeline,<br />
                  <span className="text-blue-600">Always Full</span>
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-xl text-gray-700 mb-8"
                >
                  B2Lead finds qualified leads for web designers and developers who need your services right now.
                </motion.p>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4"
                >
                  <a href="#signup" className="bg-blue-600 text-white px-8 py-3 rounded-md text-lg font-medium hover:bg-blue-700 transition-colors text-center">
                    Start Free Trial
                  </a>
                  <a href="#demo" className="border border-blue-600 text-blue-600 px-8 py-3 rounded-md text-lg font-medium hover:bg-blue-50 transition-colors text-center">
                    See Demo
                  </a>
                </motion.div>
              </div>
              <div className="md:w-1/2">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                  className="relative"
                >
                  <div className="w-full h-96 bg-blue-100 rounded-2xl overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <img 
                        src="/image.png" 
                        alt="B2Lead Dashboard Preview" 
                        className="rounded-lg shadow-xl"
                      />
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
            
            {/* Stats */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 md:mt-24"
            >
              <motion.div variants={fadeIn} className="bg-white p-6 rounded-xl shadow-sm">
                <div className="text-4xl font-bold text-blue-600 mb-2">8.5x</div>
                <div className="text-gray-700">Average ROI for agencies using our platform</div>
              </motion.div>
              <motion.div variants={fadeIn} className="bg-white p-6 rounded-xl shadow-sm">
                <div className="text-4xl font-bold text-blue-600 mb-2">35k+</div>
                <div className="text-gray-700">Qualified leads delivered to our customers monthly</div>
              </motion.div>
              <motion.div variants={fadeIn} className="bg-white p-6 rounded-xl shadow-sm">
                <div className="text-4xl font-bold text-blue-600 mb-2">92%</div>
                <div className="text-gray-700">Customer satisfaction rating</div>
              </motion.div>
            </motion.div>
          </div>
        </section>
        
        {/* Features Section */}
        <section id="features" className="py-20 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Powerful Features</h2>
              <p className="text-xl text-gray-700 max-w-2xl mx-auto">
                Everything you need to discover, engage, and convert potential clients for your web design and development services.
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={pulse}
                  className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-700">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        
        {/* How It Works */}
        <section id="how-it-works" className="py-20 bg-blue-50">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">How B2Lead Works</h2>
              <p className="text-xl text-gray-700 max-w-2xl mx-auto">
                Our simple 4-step process brings qualified leads directly to your inbox.
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  step: "1",
                  title: "We Search",
                  description: "Our AI scans the web for businesses that need web design or development help."
                },
                {
                  step: "2",
                  title: "We Qualify",
                  description: "Leads are scored based on budget potential, tech stack, and conversion likelihood."
                },
                {
                  step: "3",
                  title: "We Enrich",
                  description: "Contact data is verified and enhanced with decision-maker information."
                },
                {
                  step: "4",
                  title: "You Connect",
                  description: "Qualified leads are delivered to your dashboard ready for you to reach out."
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-100px" }}
                  variants={fadeIn}
                  className="relative"
                >
                  <div className="bg-white rounded-xl p-6 shadow-sm relative z-10">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mb-4">
                      {item.step}
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-900">{item.title}</h3>
                    <p className="text-gray-700">{item.description}</p>
                  </div>
                  {index < 3 && (
                    <div className="hidden lg:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 z-0">
                      <svg width="40" height="12" viewBox="0 0 40 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M40 6L30 0.226497V11.7735L40 6ZM0 7H31V5H0V7Z" fill="#3B82F6"/>
                      </svg>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
            
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="mt-16 text-center"
            >
              <a href="#signup" className="bg-blue-600 text-white px-8 py-3 rounded-md text-lg font-medium hover:bg-blue-700 transition-colors inline-block">
                Start Finding Leads Now
              </a>
            </motion.div>
          </div>
        </section>
        
        {/* Testimonials */}
        <section id="testimonials" className="py-20 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">What Our Customers Say</h2>
              <p className="text-xl text-gray-700 max-w-2xl mx-auto">
                Join hundreds of web professionals who've transformed their business with B2Lead.
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeIn}
                  className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm"
                >
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
                      <img 
                        src={testimonial.avatar} 
                        alt={testimonial.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="ml-4">
                      <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                      <p className="text-gray-600 text-sm">{testimonial.role}, {testimonial.company}</p>
                    </div>
                  </div>
                  <blockquote className="text-gray-700 italic">"{testimonial.quote}"</blockquote>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Pricing */}
        <section id="pricing" className="py-20 bg-blue-50">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Simple, Transparent Pricing</h2>
              <p className="text-xl text-gray-700 max-w-2xl mx-auto">
                Choose the plan that fits your business needs. No long-term contracts, cancel anytime.
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {plans.map((plan, index) => (
                <motion.div
                  key={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={pulse}
                  className={`rounded-xl p-6 ${plan.highlighted ? 'bg-white shadow-lg scale-105 border-2 border-blue-500' : 'bg-white border border-gray-100 shadow-sm'}`}
                >
                  <h3 className="text-2xl font-bold mb-2 text-gray-900">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 ml-1">{plan.period}</span>
                  </div>
                  <p className="text-gray-700 mb-6">{plan.description}</p>
                  <ul className="mb-8 space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center">
                        <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                        </svg>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <a 
                    href="#signup" 
                    className={`block text-center w-full py-3 rounded-md transition-colors ${plan.highlighted ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}
                  >
                    {plan.cta}
                  </a>
                </motion.div>
              ))}
            </div>
            
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="text-center mt-12 text-gray-700"
            >
              <p>Need a custom solution? <a href="#contact" className="text-blue-600 hover:underline">Contact our sales team</a></p>
            </motion.div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section id="signup" className="py-20 bg-blue-600 text-white">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="max-w-3xl mx-auto text-center"
            >
              <motion.h2 variants={fadeIn} className="text-3xl md:text-4xl font-bold mb-6">
                Ready to Fill Your Sales Pipeline?
              </motion.h2>
              <motion.p variants={fadeIn} className="text-xl mb-8 text-blue-100">
                Get started with a 14-day free trial. No credit card required.
              </motion.p>
              <motion.form 
                variants={fadeIn} 
                className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
              >
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="px-4 py-3 rounded-md text-gray-900 w-full sm:w-auto flex-grow"
                  required
                />
                <button 
                  type="submit" 
                  className="bg-white text-blue-600 px-6 py-3 rounded-md font-medium hover:bg-blue-50 transition-colors"
                >
                  Start Free Trial
                </button>
              </motion.form>
              <motion.p variants={fadeIn} className="text-blue-100 text-sm">
                By signing up, you agree to our Terms of Service and Privacy Policy
              </motion.p>
            </motion.div>
          </div>
        </section>
        
        {/* FAQ Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Frequently Asked Questions</h2>
              <p className="text-xl text-gray-700 max-w-2xl mx-auto">
                Everything you need to know about B2Lead
              </p>
            </motion.div>
            
            <div className="max-w-3xl mx-auto">
              {[
                {
                  question: "How does B2Lead find leads?",
                  answer: "B2Lead uses a combination of AI and manual verification to scan websites across the internet for signs that a business needs web design or development services. We look at factors like outdated designs, performance issues, mobile compatibility problems, and recent business changes."
                },
                {
                  question: "How qualified are the leads?",
                  answer: "All leads are verified to ensure they're real businesses with genuine web needs. We rate each lead based on criteria like budget potential, urgency, and fit for web services. Our customers report an average 20-30% response rate from cold outreach to our leads."
                },
                {
                  question: "Can I target specific industries or locations?",
                  answer: "Yes! You can filter leads by industry, location, company size, estimated budget, and type of web services needed. This ensures you only receive leads that match your ideal client profile."
                },
                {
                  question: "How many leads can I expect each month?",
                  answer: "This depends on your plan. Our Starter plan provides 50 qualified leads monthly, Growth offers 150, and Agency delivers 500. Custom enterprise plans are available for larger needs."
                },
                {
                  question: "Can I export leads to my CRM?",
                  answer: "Yes! B2Lead integrates with popular CRMs like HubSpot, Pipedrive, and Salesforce. We also provide CSV exports for any system."
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeIn}
                  className="mb-6 border-b border-gray-200 pb-6 last:border-0"
                >
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">{item.question}</h3>
                  <p className="text-gray-700">{item.answer}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Contact Section */}
        <section id="contact" className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Get in Touch</h2>
              <p className="text-xl text-gray-700 max-w-2xl mx-auto">
                Have questions? Our team is here to help you get started.
              </p>
            </motion.div>
            
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.div 
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeIn}
                >
                  <h3 className="text-xl font-semibold mb-4 text-gray-900">Contact Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="text-blue-600 mr-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Email</p>
                        <a href="mailto:hello@b2lead.com" className="text-gray-700 hover:text-blue-600">hello@b2lead.com</a>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="text-blue-600 mr-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Phone</p>
                        <a href="tel:+18005551234" className="text-gray-700 hover:text-blue-600">+1 (800) 555-1234</a>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="text-blue-600 mr-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Office</p>
                        <p className="text-gray-700">123 Tech Lane, Suite 500<br />San Francisco, CA 94107</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    <h3 className="text-xl font-semibold mb-4 text-gray-900">Follow Us</h3>
                    <div className="flex space-x-4">
                      {["twitter", "linkedin", "facebook", "instagram"].map((platform) => (
                        <a 
                          key={platform}
                          href={`#${platform}`} 
                          className="bg-white w-10 h-10 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
                        >
                          <span className="sr-only">{platform}</span>
                          <div className="text-blue-600">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 2C6.477 2 2 6.477 2 12c0 5.523 4.477 10 10 10s10-4.477 10-10c0-5.523-4.477-10-10-10z" />
                            </svg>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </motion.div>
                
                <motion.div 
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeIn}
                  className="bg-white p-6 rounded-xl shadow-sm"
                >
                  <h3 className="text-xl font-semibold mb-4 text-gray-900">Send Us a Message</h3>
                  <form>
                    <div className="mb-4">
                      <label htmlFor="name" className="block text-gray-700 mb-2">Name</label>
                      <input 
                        type="text" 
                        id="name" 
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label htmlFor="email" className="block text-gray-700 mb-2">Email</label>
                      <input 
                        type="email" 
                        id="email" 
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label htmlFor="subject" className="block text-gray-700 mb-2">Subject</label>
                      <input 
                        type="text" 
                        id="subject" 
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div className="mb-6">
                      <label htmlFor="message" className="block text-gray-700 mb-2">Message</label>
                      <textarea 
                        id="message" 
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      ></textarea>
                    </div>
                    <button 
                      type="submit" 
                      className="w-full bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors"
                    >
                      Send Message
                    </button>
                  </form>
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold text-white mb-4">B2Lead</div>
              <p className="mb-4">
                The ultimate lead generation platform for web design and development professionals.
              </p>
              <p>&copy; {new Date().getFullYear()} B2Lead. All rights reserved.</p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#demo" className="hover:text-white transition-colors">Demo</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Guides</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p>Designed with ❤️ for web professionals</p>
            <div className="mt-4 md:mt-0">
              <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">Privacy Policy</a>
              <span className="mx-2">|</span>
              <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

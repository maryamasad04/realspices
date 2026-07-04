'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import SiteFooter from '@/components/site-footer';
import PageShell from '@/components/site/page-shell';
import PageHero from '@/components/site/page-hero';
import SectionHeader from '@/components/site/section-header';
import { useTheme } from '@/hooks/use-theme';
import {
  siteContainer,
  siteSection,
  siteCard,
  siteBtnPrimary,
  siteBtnSecondary,
  siteSubtext,
  siteInput,
  siteDivider,
} from '@/lib/siteStyles';
import { cn } from '@/lib/utils';

export default function ContactPage() {
  const { dark: darkMode } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      setSubmitStatus('error');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone?.trim() || null,
          subject: formData.subject.trim(),
          message: formData.message.trim(),
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmitStatus('success');
        console.log('Contact form submitted successfully:', result);

        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in';
        notification.innerHTML = '✅ Message sent! Admin will be notified';
        document.body.appendChild(notification);
        setTimeout(() => document.body.removeChild(notification), 4000);

        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
        });
        setTimeout(() => setSubmitStatus('idle'), 5000);
      } else {
        console.error('API error:', result.error);
        setSubmitStatus('error');
      }
    } catch (error: unknown) {
      console.error('Contact form submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleActionClick = (action: string) => {
    switch (action) {
      case 'Get Directions': {
        const storeAddress = '11-3-184, Moazampura, Mallepally, Hyderabad, Telangana 500001, India';
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(storeAddress)}`, '_blank');
        break;
      }
      case 'Call Now':
        window.open('tel:+919876543210', '_self');
        break;
      case 'Send Email':
        window.open('https://mail.google.com/mail/?view=cm&to=info@realspices.com', '_blank');
        break;
      case 'View Calendar':
        window.open('https://calendar.google.com/', '_blank');
        break;
    }
  };

  const contactInfo = [
    {
      icon: <MapPin className={`w-5 h-5 ${darkMode ? 'text-amber-400/80' : 'text-rose-700'}`} />,
      title: 'Visit Our Store',
      details: ['11-3-184, Moazampura', 'Mallepally, Hyderabad, Telangana - 500001', 'India'],
      action: 'Get Directions',
    },
    {
      icon: <Phone className={`w-5 h-5 ${darkMode ? 'text-amber-400/80' : 'text-rose-700'}`} />,
      title: 'Call Us',
      details: ['+91 98765 43210', '+91 98765 43211', 'Mon-Sat: 9AM-7PM'],
      action: 'Call Now',
    },
    {
      icon: <Mail className={`w-5 h-5 ${darkMode ? 'text-amber-400/80' : 'text-rose-700'}`} />,
      title: 'Email Us',
      details: ['info@realspices.com', 'support@realspices.com', 'orders@realspices.com'],
      action: 'Send Email',
    },
    {
      icon: <Clock className={`w-5 h-5 ${darkMode ? 'text-amber-400/80' : 'text-rose-700'}`} />,
      title: 'Business Hours',
      details: ['Monday - Saturday:', '9:00 AM - 7:00 PM', 'Sunday:', '10:00 AM - 5:00 PM'],
      action: 'View Calendar',
    },
  ];

  const faqs = [
    {
      question: 'How do I know if the saffron is authentic?',
      answer:
        'All our saffron comes with lab test certificates and authenticity guarantees. We provide detailed quality reports with every purchase.',
    },
    {
      question: 'What is your return policy?',
      answer:
        "We offer a 30-day money-back guarantee. If you're not satisfied with the quality, you can return the product for a full refund.",
    },
    {
      question: 'Do you ship internationally?',
      answer:
        'Currently, we ship within India. International shipping is available for bulk orders. Please contact us for more details.',
    },
    {
      question: 'How should I store saffron?',
      answer:
        'Store saffron in a cool, dry place away from direct sunlight. Keep it in an airtight container to preserve its aroma and potency.',
    },
  ];

  const labelClass = cn(
    'block text-[11px] font-medium tracking-[0.15em] uppercase mb-2',
    darkMode ? 'text-gray-400' : 'text-gray-600'
  );

  return (
    <PageShell>
      <PageHero
        eyebrow="Contact"
        title="Get in Touch"
        description="Have questions about our saffron products? We're here to help! Reach out to us and we'll get back to you as soon as possible."
      />

      {/* Contact Info */}
      <section className={siteSection(darkMode, 'muted')}>
        <div className={siteContainer()}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => (
              <div key={index} className={`${siteCard(darkMode, true)} p-8 text-center`}>
                <div
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-6 ${
                    darkMode ? 'bg-white/5' : 'bg-stone-50'
                  }`}
                >
                  {info.icon}
                </div>
                <h3 className={`text-sm font-medium tracking-[0.1em] uppercase mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {info.title}
                </h3>
                <div className="space-y-1 mb-6">
                  {info.details.map((detail, idx) => (
                    <p key={idx} className={siteSubtext(darkMode)}>
                      {detail}
                    </p>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => handleActionClick(info.action)}
                  className={siteBtnSecondary(darkMode)}
                >
                  {info.action}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className={siteSection(darkMode)}>
        <div className={`${siteContainer()} max-w-3xl`}>
          <SectionHeader
            eyebrow="Message"
            title="Send Us a Message"
            description="Fill out the form below and we'll respond within 24 hours."
          />

          <div className={`${siteCard(darkMode)} p-8 md:p-10`}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className={labelClass}>
                    Full Name *
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className={siteInput(darkMode, 'w-full')}
                  />
                </div>

                <div>
                  <label htmlFor="email" className={labelClass}>
                    Email Address *
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className={siteInput(darkMode, 'w-full')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="phone" className={labelClass}>
                    Phone Number
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    className={siteInput(darkMode, 'w-full')}
                  />
                </div>

                <div>
                  <label htmlFor="subject" className={labelClass}>
                    Subject *
                  </label>
                  <Input
                    id="subject"
                    name="subject"
                    type="text"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="What's this about?"
                    className={siteInput(darkMode, 'w-full')}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="message" className={labelClass}>
                  Message *
                </label>
                <Textarea
                  id="message"
                  name="message"
                  required
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us how we can help you..."
                  rows={6}
                  className={siteInput(darkMode, 'w-full min-h-[160px] resize-y')}
                />
              </div>

              {submitStatus === 'success' && (
                <div
                  className={`p-4 rounded-xl border ${
                    darkMode ? 'bg-green-900/20 border-green-800/50' : 'bg-green-50 border-green-200'
                  }`}
                >
                  <p className={`text-center text-sm font-medium ${darkMode ? 'text-green-400' : 'text-green-700'}`}>
                    ✓ Message sent successfully! We&apos;ll get back to you soon.
                  </p>
                </div>
              )}

              {submitStatus === 'error' && (
                <div
                  className={`p-4 rounded-xl border ${
                    darkMode ? 'bg-rose-900/20 border-rose-800/50' : 'bg-rose-50 border-rose-200'
                  }`}
                >
                  <p className={`text-center text-sm font-medium ${darkMode ? 'text-rose-400' : 'text-rose-700'}`}>
                    ✗ Failed to send message. Please try again.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={siteBtnPrimary('w-full inline-flex items-center justify-center gap-2 disabled:opacity-50')}
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={siteSection(darkMode, 'alt')}>
        <div className={`${siteContainer()} max-w-3xl`}>
          <SectionHeader
            eyebrow="FAQ"
            title="Frequently Asked Questions"
            description="Quick answers to common questions about our saffron products."
          />

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className={`${siteCard(darkMode)} p-6`}>
                <h3 className={`text-base font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {faq.question}
                </h3>
                <p className={siteSubtext(darkMode)}>{faq.answer}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className={siteSubtext(darkMode)}>Still have questions? Contact our team.</p>
          </div>
        </div>
      </section>

      <div className={siteDivider(darkMode)} />
      <SiteFooter />
    </PageShell>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Award, Users, Leaf, Heart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import SiteFooter from '@/components/site-footer';
import PageShell from '@/components/site/page-shell';
import PageHero from '@/components/site/page-hero';
import SectionHeader from '@/components/site/section-header';
import { useTheme } from '@/hooks/use-theme';
import { getJourneyMilestones, getTeamMembers, JourneyMilestone, TeamMember } from '@/lib/aboutApi';
import {
  siteContainer,
  siteSection,
  siteCard,
  siteBtnPrimary,
  siteBtnSecondary,
  siteSubtext,
  siteEyebrow,
  siteHeading,
  siteBadge,
  siteDivider,
} from '@/lib/siteStyles';

export default function AboutPage() {
  const { dark: darkMode } = useTheme();
  const [milestones, setMilestones] = useState<JourneyMilestone[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [contentLoading, setContentLoading] = useState(true);

  useEffect(() => {
    const fetchAboutContent = async () => {
      try {
        const [journeyData, teamData] = await Promise.all([
          getJourneyMilestones(),
          getTeamMembers(true),
        ]);
        setMilestones(journeyData);
        setTeam(teamData);
      } catch (error) {
        console.error('Failed to load About Us content:', error);
      } finally {
        setContentLoading(false);
      }
    };
    fetchAboutContent();
  }, []);

  useEffect(() => {
    if (contentLoading || typeof window === 'undefined') return;
    if (window.location.hash !== '#our-journey') return;

    const section = document.getElementById('our-journey');
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [contentLoading]);

  const values = [
    {
      icon: <Award className="w-7 h-7 text-amber-500/80" />,
      title: 'Quality First',
      description: 'We never compromise on quality. Every batch is carefully tested and certified.',
    },
    {
      icon: <Heart className="w-7 h-7 text-rose-500/80" />,
      title: 'Customer Love',
      description: 'Our customers are at the heart of everything we do. Their satisfaction is our priority.',
    },
    {
      icon: <Leaf className="w-7 h-7 text-emerald-500/80" />,
      title: 'Sustainability',
      description: 'We support sustainable farming practices and fair trade with our partner farmers.',
    },
    {
      icon: <Users className="w-7 h-7 text-blue-400/80" />,
      title: 'Community',
      description: 'We believe in building strong relationships with farmers and local communities.',
    },
  ];

  return (
    <PageShell>
      <PageHero
        eyebrow="Our Heritage"
        title="Our Story"
        description="From the pristine valleys of Kashmir to your kitchen, we've been dedicated to bringing you the world's finest saffron for over 25 years. Each thread tells a story of tradition, quality, and passion."
      >
        <div className="w-full max-w-3xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 mb-8">
            <div className="text-center">
              <div className={`text-2xl font-light ${darkMode ? 'text-white' : 'text-gray-900'}`}>25+</div>
              <div className={`text-[10px] tracking-[0.15em] uppercase mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Years Experience</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-light ${darkMode ? 'text-white' : 'text-gray-900'}`}>10K+</div>
              <div className={`text-[10px] tracking-[0.15em] uppercase mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Happy Customers</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-light ${darkMode ? 'text-white' : 'text-gray-900'}`}>100%</div>
              <div className={`text-[10px] tracking-[0.15em] uppercase mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pure & Authentic</div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <Link href="/products" className={siteBtnPrimary('inline-flex items-center justify-center')}>
              Explore Our Products
            </Link>
            <a href="#our-journey" className={siteBtnSecondary(darkMode, 'inline-flex items-center justify-center')}>
              Our Journey
            </a>
          </div>
          <div className="relative max-w-md mx-auto">
            <Image
              src="/a-7.jpg"
              alt="Premium saffron threads in container"
              width={500}
              height={350}
              className={`rounded-2xl object-cover w-full ${darkMode ? 'border border-white/10' : 'border border-rose-200/60'}`}
            />
            <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:-right-3 ${siteCard(darkMode)} px-4 py-3`}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full" />
                <span className={`text-xs tracking-[0.1em] uppercase ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Premium Quality</span>
              </div>
            </div>
          </div>
        </div>
      </PageHero>

      {/* Saffron Benefits */}
      <section className={siteSection(darkMode)}>
        <div className={siteContainer()}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <Image
                src="/Incredible Saffron Health Benefits.jpg"
                alt="Benefits of Saffron infographic"
                width={400}
                height={350}
                className={`rounded-2xl border ${darkMode ? 'border-white/10' : 'border-gray-200/80'}`}
              />
            </div>

            <div>
              <span className={siteEyebrow(darkMode)}>Wellness</span>
              <h2 className={`${siteHeading(darkMode, 'md')} mb-6`}>The Golden Spice of Wellness</h2>
              <p className={`${siteSubtext(darkMode)} mb-8`}>
                Saffron isn&apos;t just a culinary treasure—it&apos;s a powerhouse of health benefits.
                From ancient Ayurvedic traditions to modern scientific research, saffron has
                been celebrated for its remarkable properties.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  'High in Antioxidants',
                  'Promotes Brain Health',
                  'Natural Mood Enhancer',
                  'Supports Heart Health',
                  'Anti-inflammatory Properties',
                  'Improves Skin Health',
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full ${darkMode ? 'bg-amber-400/70' : 'bg-rose-700/70'}`} />
                    <span className={siteSubtext(darkMode)}>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Journey */}
      <section
        id="our-journey"
        className={`${siteSection(darkMode, 'muted')} scroll-mt-24`}
      >
        <div className={siteContainer()}>
          <SectionHeader
            eyebrow="Timeline"
            title="Our Journey"
            description="A timeline of our commitment to excellence and growth in the saffron industry."
          />

          <div className="relative">
            <div className={`absolute left-1/2 -translate-x-1/2 h-full w-px ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`} />

            {contentLoading ? (
              <div className="text-center py-12">
                <div className={`animate-spin rounded-full h-8 w-8 border-b-2 mx-auto ${darkMode ? 'border-amber-500/50' : 'border-rose-700/50'}`} />
              </div>
            ) : milestones.length === 0 ? (
              <p className={`text-center py-12 ${siteSubtext(darkMode)}`}>
                Our journey milestones will appear here soon.
              </p>
            ) : (
              milestones.map((milestone, index) => (
                <div
                  key={milestone.id}
                  className={`flex items-center mb-10 ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8'}`}>
                    <div className={`${siteCard(darkMode, true)} p-6`}>
                      <div className={`text-lg font-light mb-2 ${darkMode ? 'text-amber-300/90' : 'text-rose-800'}`}>
                        {milestone.year}
                      </div>
                      <h3 className={`${siteHeading(darkMode, 'sm')} mb-2`}>{milestone.title}</h3>
                      <p className={siteSubtext(darkMode)}>{milestone.description}</p>
                    </div>
                  </div>

                  <div className="relative z-10">
                    <div
                      className={`w-3 h-3 rounded-full border-2 ${
                        darkMode ? 'bg-amber-400/80 border-gray-950' : 'bg-rose-700/80 border-stone-100'
                      }`}
                    />
                  </div>

                  <div className="w-1/2" />
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className={siteSection(darkMode, 'alt')}>
        <div className={siteContainer()}>
          <SectionHeader
            eyebrow="Principles"
            title="Our Values"
            description="The principles that guide us in delivering the finest saffron experience."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div key={index} className={`${siteCard(darkMode, true)} p-8 text-center`}>
                <div
                  className={`inline-flex items-center justify-center w-14 h-14 rounded-full mb-6 ${
                    darkMode ? 'bg-white/5' : 'bg-stone-50'
                  }`}
                >
                  {value.icon}
                </div>
                <h3 className={`${siteHeading(darkMode, 'sm')} mb-3`}>{value.title}</h3>
                <p className={siteSubtext(darkMode)}>{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Saffron Flower */}
      <section className={siteSection(darkMode)}>
        <div className={siteContainer()}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className={siteEyebrow(darkMode)}>Origin</span>
              <h2 className={`${siteHeading(darkMode, 'md')} mb-6`}>The Sacred Crocus Flower</h2>
              <p className={`${siteSubtext(darkMode)} mb-8`}>
                Each saffron thread comes from the delicate stigmas of the Crocus sativus flower.
                It takes over 150 flowers to produce just 1 gram of saffron, making it one of the
                world&apos;s most precious spices.
              </p>

              <div className="space-y-3">
                {[
                  'Hand-picked at dawn for maximum potency',
                  'Only 3 stigmas per flower',
                  'Harvested during a brief 2-week season',
                  'Dried using traditional methods',
                  'Each thread carefully selected for quality',
                ].map((fact, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full ${darkMode ? 'bg-amber-400/70' : 'bg-rose-700/70'}`} />
                    <span className={siteSubtext(darkMode)}>{fact}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <Image
                src="/a-6.jpg"
                alt="Beautiful purple saffron crocus flower"
                width={600}
                height={600}
                className={`rounded-2xl object-cover border ${darkMode ? 'border-white/10' : 'border-gray-200/80'}`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className={siteSection(darkMode, 'muted')}>
        <div className={siteContainer()}>
          <SectionHeader
            eyebrow="People"
            title="Meet Our Team"
            description="The passionate people behind Tadbir's commitment to excellence."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contentLoading ? (
              <div className="col-span-full text-center py-12">
                <div className={`animate-spin rounded-full h-8 w-8 border-b-2 mx-auto ${darkMode ? 'border-amber-500/50' : 'border-rose-700/50'}`} />
              </div>
            ) : team.length === 0 ? (
              <p className={`col-span-full text-center py-12 ${siteSubtext(darkMode)}`}>
                Our team members will appear here soon.
              </p>
            ) : (
              team.map((member) => (
                <div key={member.id} className={`${siteCard(darkMode, true)} p-8 text-center`}>
                  <div className="relative mb-6">
                    {member.image ? (
                      <Image
                        src={member.image}
                        alt={member.name}
                        width={200}
                        height={200}
                        className={`w-28 h-28 rounded-full mx-auto object-cover border ${
                          darkMode ? 'border-white/10' : 'border-gray-200/80'
                        }`}
                        unoptimized
                      />
                    ) : (
                      <div
                        className={`w-28 h-28 rounded-full mx-auto flex items-center justify-center border ${
                          darkMode ? 'border-white/10 bg-white/5' : 'border-gray-200/80 bg-stone-50'
                        }`}
                      >
                        <Users className="w-10 h-10 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <h3 className={`${siteHeading(darkMode, 'sm')} mb-1`}>{member.name}</h3>
                  <span className={`${siteBadge(darkMode)} inline-block mb-4`}>{member.designation}</span>
                  <p className={siteSubtext(darkMode)}>{member.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={`${siteSection(darkMode)} border-t ${darkMode ? 'border-white/10' : 'border-gray-200/80'}`}>
        <div className={`${siteContainer()} max-w-3xl text-center`}>
          <span className={siteEyebrow(darkMode)}>Get Started</span>
          <h2 className={`${siteHeading(darkMode, 'md')} mb-6`}>
            Ready to Experience Premium Saffron?
          </h2>
          <p className={`${siteSubtext(darkMode)} mb-8`}>
            Join our family of satisfied customers and discover why Tadbir is the trusted choice
            for authentic Kashmiri saffron. Every thread tells a story of tradition and excellence.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/products" className={siteBtnPrimary('inline-flex items-center justify-center')}>
              Shop Our Products
            </Link>
            <Link href="/contact" className={siteBtnSecondary(darkMode, 'inline-flex items-center justify-center')}>
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <div className={siteDivider(darkMode)} />
      <SiteFooter />
    </PageShell>
  );
}

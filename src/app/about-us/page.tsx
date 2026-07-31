import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';

export const metadata: Metadata = {
  title: 'Our Story | Wedding Support Company',
  description:
    'Discover the story behind Wedding Support Company. Learn how our tech-driven, free concierge service is fixing the broken, expensive process of booking destination wedding venues.',
  keywords: [
    'about us',
    'our story',
    'wedding support company',
    'wedding venue advisory',
    'free wedding concierge',
    'transparent wedding planning',
    'destination wedding experts',
  ],
  alternates: {
    canonical: 'https://weddingsupportcompany.com/about-us',
  },
  openGraph: {
    type: 'website',
    url: 'https://weddingsupportcompany.com/about-us',
    title: 'Our Story | Wedding Support Company',
    description:
      'How our free, tech-driven concierge service is fixing the broken, expensive process of booking destination wedding venues.',
    images: [
      {
        url: 'https://weddingsupportcompany.com/assets/images/social-cover-story.jpg',
      },
    ],
  },
};

export default function AboutUsPage() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Wedding Support Company',
    url: 'https://www.weddingsupportcompany.com',
    logo: 'https://firebasestorage.googleapis.com/v0/b/saas-c8ee9.firebasestorage.app/o/uploads%2Fthumbnails%2F1774539682469_Gemini_Generated_Image_6vv0m66vv0m66vv0-removebg-preview.png?alt=media&token=8adcd818-6692-4fa1-b374-6b11371f6ee9',
    description:
      'Wedding Support Company is an India-based wedding planning and wedding support platform that helps couples plan, manage, and execute weddings through planning tools, concierge support, vendor coordination, and wedding management services.',
    foundingDate: '2012',
    founder: {
      '@type': 'Person',
      name: 'Anshul Saxena',
      jobTitle: 'Founder & CEO',
    },
    areaServed: [
      { '@type': 'AdministrativeArea', name: 'Northern India' },
      { '@type': 'AdministrativeArea', name: 'Delhi-NCR' },
      { '@type': 'AdministrativeArea', name: 'Haridwar' },
      { '@type': 'AdministrativeArea', name: 'Jim Corbett' },
      { '@type': 'AdministrativeArea', name: 'Mussoorie' },
      { '@type': 'AdministrativeArea', name: 'Jaipur' },
      { '@type': 'AdministrativeArea', name: 'Goa' },
    ],
    knowsAbout: [
      'Destination Wedding Venues',
      'Wedding Planning',
      '360 Virtual Resort Tours',
      'Wedding Budget Estimations',
      'Resort Contract Auditing',
      'Wedding Concierge Services',
    ],
  };

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'Wedding Support Company',
    image:
      'https://firebasestorage.googleapis.com/v0/b/saas-c8ee9.firebasestorage.app/o/uploads%2Fthumbnails%2F1774539682469_Gemini_Generated_Image_6vv0m66vv0m66vv0-removebg-preview.png?alt=media&token=8adcd818-6692-4fa1-b374-6b11371f6ee9',
    '@id': 'https://www.weddingsupportcompany.com/#localbusiness',
    url: 'https://www.weddingsupportcompany.com',
    telephone: '+91-8006806666',
    priceRange: '0',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'F-14, Satyam Enclave',
      addressLocality: 'Vivek Vihar, Delhi',
      addressRegion: 'North India',
      postalCode: '110092',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '28.667237403561742',
      longitude: '77.30579600981122',
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ],
      opens: '09:00',
      closes: '21:00',
    },
  };

  return (
    <div className="bg-white text-gray-900 antialiased overflow-x-hidden">
      {/* Structured Data Scripts */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />

      {/* Navigation */}
      <Navbar />

      <main className="w-full pt-20">
        {/* CHAPTER I: THE PROBLEM */}
        <section className="py-20 md:py-32">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="max-w-3xl">
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-black">
                Venue hunting was broken.
              </h1>
              <p className="mt-6 text-xl text-gray-600">
                For 14 years, we watched families navigate the beautiful chaos of wedding planning, only to be stopped by one universal roadblock: the exhausting, expensive, and opaque process of choosing a resort.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center md:text-left">
              <div className="border-t-2 border-black pt-4">
                <p className="text-4xl font-bold tracking-tighter">₹50,000+</p>
                <p className="mt-2 text-gray-500">Spent on travel just to visit a few properties.</p>
              </div>
              <div className="border-t-2 border-black pt-4">
                <p className="text-4xl font-bold tracking-tighter">12+</p>
                <p className="mt-2 text-gray-500">Decision-makers with conflicting schedules to align.</p>
              </div>
              <div className="border-t-2 border-black pt-4">
                <p className="text-4xl font-bold tracking-tighter">Countless</p>
                <p className="mt-2 text-gray-500">Hours wasted on venues with hidden charges.</p>
              </div>
              <div className="border-t-2 border-black pt-4">
                <p className="text-4xl font-bold tracking-tighter">High Fees</p>
                <p className="mt-2 text-gray-500">Charged by planners just for venue suggestions.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CHAPTER II: THE SHIFT */}
        <section className="bg-gray-100 py-20 md:py-32">
          <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-black">
              So we built a better way.
            </h2>
            <p className="mt-6 text-xl text-gray-600">
              We founded Wedding Support Company on a simple belief: the lead-up to your wedding should be defined by excitement, not logistical exhaustion and financial guesswork. We are not traditional wedding planners. We are your dedicated, independent venue advisors.
            </p>
          </div>
        </section>

        {/* CHAPTER III: THE SOLUTION */}
        <section className="py-20 md:py-32 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            {/* Part 1: The Technology */}
            <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-center">
              <div className="relative">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/saas-c8ee9-c4tkm-india/o/ChatGPT%20Image%20Jun%202%2C%202026%2C%2010_27_04%20PM.png?alt=media&token=b9e7ffe7-27f7-40ab-b198-1ff5defff61a"
                  alt="A sleek modern tablet showing a virtual tour"
                  className="rounded-lg w-full z-10 relative"
                />
                <div className="absolute -top-8 -left-8 w-full h-full border-4 border-gray-200 rounded-lg z-0"></div>
              </div>
              <div>
                <h3 className="text-3xl md:text-4xl font-bold tracking-tight text-black">
                  Technology That Creates Clarity
                </h3>
                <p className="mt-4 text-gray-600">
                  We brought the entire venue discovery process online, making it transparent, instant, and accessible from your living room.
                </p>
                <ul className="mt-8 space-y-6">
                  <li className="flex items-start gap-4">
                    <i className="ph ph-camera-rotate text-2xl text-black mt-1"></i>
                    <div>
                      <h4 className="font-semibold">Immersive 360° Tours</h4>
                      <p className="text-gray-500">Digitally walk through every lawn, hall, and room.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <i className="ph ph-calculator text-2xl text-black mt-1"></i>
                    <div>
                      <h4 className="font-semibold">Instant Budget Estimates</h4>
                      <p className="text-gray-500">Get an immediate, transparent cost breakdown.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <i className="ph ph-check-square-offset text-2xl text-black mt-1"></i>
                    <div>
                      <h4 className="font-semibold">Curated Shortlists</h4>
                      <p className="text-gray-500">Filter hundreds of properties to find your perfect match.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Part 2: The Human Touch */}
            <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-center mt-24 md:mt-40">
              <div className="md:order-2 relative">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/saas-c8ee9.firebasestorage.app/o/ChatGPT%20Image%20Jun%206%2C%202026%2C%2003_40_24%20PM.png?alt=media&token=9ab619dd-99eb-43c8-91fc-ccb76ae95c0e"
                  alt="A professional and friendly team collaborating"
                  className="rounded-lg w-full z-10 relative"
                />
                <div className="absolute -top-8 -right-8 w-full h-full border-4 border-gray-200 rounded-lg z-0"></div>
              </div>
              <div className="md:order-1">
                <h3 className="text-3xl md:text-4xl font-bold tracking-tight text-black">
                  Expertise That Gets It Done
                </h3>
                <p className="mt-4 text-gray-600">
                  Technology gets you halfway, but human expertise crosses the finish line. Our concierges are your personal advocates.
                </p>
                <ul className="mt-8 space-y-6">
                  <li className="flex items-start gap-4">
                    <i className="ph ph-scales text-2xl text-black mt-1"></i>
                    <div>
                      <h4 className="font-semibold">Negotiate the Best Rates</h4>
                      <p className="text-gray-500">We leverage industry relationships to secure the best prices and perks.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <i className="ph ph-shield-check text-2xl text-black mt-1"></i>
                    <div>
                      <h4 className="font-semibold">Protect You From Hidden Fees</h4>
                      <p className="text-gray-500">We audit every contract so there are no surprises. Ever.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <i className="ph ph-path text-2xl text-black mt-1"></i>
                    <div>
                      <h4 className="font-semibold">Streamline Your Site Visits</h4>
                      <p className="text-gray-500">You’ll only visit guaranteed winners, saving time and money.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CHAPTER IV: THE PROMISE (CTA) */}
        <section className="bg-black text-white py-20 md:py-32">
          <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter">
              Your journey to the perfect venue is now smooth, smart, and completely stress-free.
            </h2>
            <div className="mt-10">
              <Link
                href="/compare-resorts"
                className="bg-white text-black px-10 py-4 rounded-full font-semibold text-lg hover:bg-gray-200 transition-colors inline-block"
              >
                Start Exploring Venues
              </Link>
            </div>
          </div>
        </section>

        {/* MEET OUR FOUNDER SECTION */}
        <section className="bg-white py-20 md:py-32 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            {/* Part 1: Founder Introduction */}
            <div className="grid lg:grid-cols-2 gap-12 md:gap-16 items-center">
              <div className="relative">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/saas-c8ee9-c4tkm-india/o/ChatGPT%20Image%20Jun%202%2C%202026%2C%2009_31_26%20PM.png?alt=media&token=b6b06e26-54eb-4d8b-bb22-e1445f94caec"
                  alt="Anshul Saxena, Founder & CEO of Wedding Support Company"
                  className="rounded-lg w-full z-10 relative border border-gray-200 aspect-[4/5] object-cover"
                />
                <div className="absolute -top-4 -left-4 w-full h-full border-2 border-gray-100 rounded-lg z-0"></div>
              </div>

              <div>
                <p className="text-base font-semibold text-gray-500 tracking-widest uppercase">
                  MEET OUR FOUNDER
                </p>
                <h2 className="mt-4 text-5xl md:text-8xl font-black tracking-tighter text-black">
                  Anshul Saxena
                </h2>
                <p className="mt-2 text-xl md:text-2xl font-semibold text-gray-500">
                  Founder & CEO, Wedding Support Company
                </p>

                <blockquote className="mt-8 border-l-4 border-[#780522] pl-6">
                  <p className="text-xl md:text-2xl font-serif font-light italic text-gray-800 leading-relaxed">
                    "In the wedding industry, there are no second chances. There is no tomorrow to fix a mistake. It is a do-or-die situation every single day, because a couple has trusted you with the most important day of their life. You either do it right, or you don’t do it at all."
                  </p>
                  <cite className="mt-4 block text-sm font-semibold text-gray-500 not-italic">
                    — Anshul Saxena
                  </cite>
                </blockquote>
              </div>
            </div>

            {/* Part 2: The Full Narrative */}
            <div className="mt-20 md:mt-28">
              <div className="max-w-4xl mx-auto">
                <div className="prose prose-lg lg:prose-xl text-stone-600 font-light max-w-none space-y-6">
                  <h3 className="text-3xl font-bold text-gray-900">
                    The 19-Year-Old Outsider Who Challenged an Industry
                  </h3>
                  <p>
                    Anshul Saxena’s journey into the wedding industry wasn’t planned; it was a collision with destiny. In 2012, at just 19 years old, an unexpected opportunity arose to plan a sangeet function for a relative's wedding. Armed with nothing but raw determination, Anshul raised his hand and said, "Let me try."
                  </p>
                  <p>
                    He booked the deal, executed the event flawlessly, and accidentally discovered his life’s calling.
                  </p>
                  <p>
                    But as he spent the next few years studying the inner workings of the Indian wedding sector, he discovered a frustrating reality. The industry was plagued by uneducated, unprofessional operators who viewed weddings purely as a survival mechanism rather than a sacred commitment. Commitments meant nothing, pricing was arbitrary, promises were broken, and most vendors were hiding behind plagiarized portfolios of other people's work. They completely lacked respect for the emotional and financial gravity of a couple’s big day.
                  </p>
                  <p>
                    Anshul refused to accept this standard. Driven by a need to bring absolute perfection to the field, he co-founded Brajwal, a premium wedding production company. To eliminate human error, he approached wedding design like an engineer—establishing rigid, uncompromising Standard Operating Procedures (SOPs). From promising pristine, brand-new fabrics and carpets for every event to enforcing rigorous maintenance protocols for props and flowers, Brajwal revolutionized the execution standards in competitive luxury hubs like Jim Corbett.
                  </p>

                  <h3 className="text-3xl font-bold text-gray-900 pt-6">
                    The Engineer’s Mind: Solving the Venue Crisis with AI
                  </h3>
                  <p>
                    Anshul’s background as a mechanical engineer meant he was hardwired to look at broken processes and build systems to fix them. As Brajwal flourished, he noticed his clients facing an even bigger, more expensive bottleneck before execution ever began: the nightmare of finding the right resort without getting exploited.
                  </p>
                  <p>
                    When he asked couples why mainstream wedding listing platforms couldn't help them, the feedback was unanimous. Existing portals operate on a "paid-listing" model—they make every resort look flawless because the resorts pay them to do so. Unbiased, honest comparisons from home were impossible.
                  </p>
                  <p>
                    Anshul saw a massive opportunity to act as a pure, transparent ally for the family, not the hospitality industry.
                  </p>
                  <p>
                    Drawing on his engineering roots and a deep obsession with modern artificial intelligence, Anshul personally leveraged advanced AI systems like Gemini to architect, code, and deploy the entire technical infrastructure for Wedding Support Company. Minimizing heavy overhead costs by utilizing tools like Firebase and cloud hosting, he built a sophisticated web portal featuring instant budget estimators and immersive 360-degree virtual tours. He achieved what traditional corporate platforms couldn't: an entirely free, hyper-transparent, tech-driven sanctuary for wedding venue scouting.
                  </p>
                </div>
              </div>
            </div>

            {/* Part 3: Leadership Philosophy */}
            <div className="mt-20 md:mt-24 max-w-7xl mx-auto grid lg:grid-cols-3 gap-12 items-start">
              <div className="lg:col-span-1">
                <h3 className="font-serif text-3xl md:text-4xl font-light text-black tracking-tight sticky top-28">
                  Leadership, Numerology, and the "Do It or Do It" Mandate
                </h3>
              </div>
              <div className="lg:col-span-2">
                <div className="text-stone-600 font-light space-y-6 text-lg">
                  <p>
                    According to numerology, Anshul is a definitive Number "1"—a natural-born, hardcore leader destined to forge his own path and dominate his segment. This leadership style is felt by every member of his team.
                  </p>
                  <p>
                    Anshul doesn't run a corporate hierarchy; he leads a highly motivated mission. He constantly reminds his staff that the wedding industry carries an emotional weight that cannot be compensated by money. To ensure total peace of mind for families, he has engineered automated operational systems that eliminate the possibility of failure. Every team member and every customer knows exactly what is going to happen, precisely when it is going to happen.
                  </p>
                  <p>
                    Anshul operates his life and his business on a singular, relentless agenda: <span className="font-semibold text-black">"Do it or do it."</span> There is no alternative, no backup plan for failure, and no room for excuses.
                  </p>
                  <p className="text-xl text-black font-normal border-l-4 border-black pl-6 py-1">
                    When you partner with Wedding Support Company, you aren't just using a tech platform. You are gaining the backing of an industry heavyweight, an engineering innovator, and a dedicated advocate who cares about the sanctity of your wedding day just as much as you do.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
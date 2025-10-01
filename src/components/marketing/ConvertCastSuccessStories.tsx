'use client';

import { Star, TrendingUp } from 'lucide-react';

export function ConvertCastSuccessStories() {
  const stories = [
    {
      name: "Sarah Chen",
      role: "Marketing Director",
      company: "TechFlow Solutions",
      avatar: "SC",
      rating: 5,
      testimonial: "ConvertCast transformed our webinars from boring presentations to revenue-generating machines. We went from 15% conversion to 68% in just two months.",
      results: { metric: "Revenue Increase", value: "340%" }
    },
    {
      name: "Marcus Rodriguez",
      role: "Sales Manager",
      company: "Growth Labs",
      avatar: "MR",
      rating: 5,
      testimonial: "The AI features are incredible. AutoOffer™ knows exactly when to present offers, and our close rates have never been higher. Best investment we've made.",
      results: { metric: "Close Rate", value: "78%" }
    },
    {
      name: "Jennifer Park",
      role: "CEO",
      company: "Digital Marketing Pro",
      avatar: "JP",
      rating: 5,
      testimonial: "We run 4-5 webinars per week and ConvertCast handles everything seamlessly. The engagement tools keep audiences captivated throughout entire presentations.",
      results: { metric: "Engagement Rate", value: "85%" }
    }
  ];

  return (
    <section className="bg-gradient-to-b from-slate-900 via-purple-950 to-indigo-950 py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-purple-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
              Real{' '}
            </span>
            <span className="text-green-400">Success Stories</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            See how businesses like yours are achieving extraordinary results with ConvertCast's
            AI-powered webinar platform.
          </p>
        </div>

        {/* Stories Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {stories.map((story, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-purple-500/20 rounded-2xl p-8 hover:bg-gradient-to-br hover:from-purple-900/30 hover:to-indigo-900/30 hover:border-purple-400/40 transition-all duration-300 group"
            >
              {/* Header */}
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-lg">{story.avatar}</span>
                </div>
                <div>
                  <h3 className="text-white font-bold">{story.name}</h3>
                  <p className="text-gray-400 text-sm">{story.role}</p>
                  <p className="text-gray-500 text-xs">{story.company}</p>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center mb-4">
                {[...Array(story.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>

              {/* Testimonial */}
              <blockquote className="text-gray-300 leading-relaxed mb-6 italic">
                "{story.testimonial}"
              </blockquote>

              {/* Result Metric */}
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-400 font-semibold text-sm">{story.results.metric}</p>
                    <p className="text-2xl font-bold text-white">{story.results.value}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-400" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Stats */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-purple-500/20 rounded-2xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-8">Join Over 50,000+ Successful Users</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">50K+</div>
                <div className="text-gray-400">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">1M+</div>
                <div className="text-gray-400">Webinars Hosted</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">$500M+</div>
                <div className="text-gray-400">Revenue Generated</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-400 mb-2">99.9%</div>
                <div className="text-gray-400">Uptime</div>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <h3 className="text-2xl font-bold text-white mb-6">
              Ready to Write Your Success Story?
            </h3>
            <button className="bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-700 hover:via-purple-600 hover:to-indigo-700 text-white font-bold px-8 py-4 rounded-lg text-lg transition-all duration-200 shadow-lg hover:shadow-xl">
              Start Your Free Trial
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
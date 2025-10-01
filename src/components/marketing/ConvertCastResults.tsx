'use client';

import { TrendingUp, Users, DollarSign } from 'lucide-react';

export function ConvertCastResults() {
  const results = [
    {
      percentage: "50%",
      label: "Higher Attendance",
      description: "More people show up and stay engaged throughout your entire webinar presentation",
      icon: Users,
      color: "text-blue-400"
    },
    {
      percentage: "78%",
      label: "Conversion Rate",
      description: "Average conversion rate achieved by ConvertCast users across all industries",
      icon: TrendingUp,
      color: "text-green-400"
    },
    {
      percentage: "59%",
      label: "Revenue Increase",
      description: "Average revenue boost within the first 90 days of switching to ConvertCast",
      icon: DollarSign,
      color: "text-purple-400"
    }
  ];

  return (
    <section className="bg-gradient-to-b from-slate-900 via-purple-950 to-indigo-950 py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-purple-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
              The Result: Your Webinars Become{' '}
            </span>
            <span className="text-green-400">Revenue Engines</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            When all these systems and tools work together on our premium cloud infrastructure, the
            numbers speak for themselves.
          </p>
        </div>

        {/* Results Grid */}
        <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
          {results.map((result, index) => (
            <div key={index} className="text-center">
              {/* Icon */}
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <result.icon className={`w-8 h-8 ${result.color}`} />
                </div>
              </div>

              {/* Percentage */}
              <div className="mb-4">
                <h3 className="text-6xl lg:text-7xl font-bold text-white mb-2">
                  {result.percentage}
                </h3>
                <div className={`w-16 h-1 ${result.color.replace('text-', 'bg-')} rounded-full mx-auto mb-4`} />
                <h4 className="text-xl font-semibold text-white mb-4">
                  {result.label}
                </h4>
              </div>

              {/* Description */}
              <p className="text-gray-400 leading-relaxed">
                {result.description}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom Stats */}
        <div className="mt-16 text-center">
          <p className="text-gray-300 text-lg mb-8">
            All of these metrics are tracked and proven across over 50,000+ live webinars. Start improving
            your numbers starting this week.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-700 hover:via-purple-600 hover:to-indigo-700 text-white font-bold px-8 py-4 rounded-lg text-lg transition-all duration-200 shadow-lg hover:shadow-xl">
              Get These Results Now
            </button>
            <button className="border border-purple-500/30 hover:bg-purple-900/20 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-all duration-200">
              See Case Studies
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
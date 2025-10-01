'use client';

import { motion } from 'framer-motion';
import { Star, Quote, ArrowRight, Users, Target, Calendar } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

const testimonials = [
  {
    id: 1,
    name: "Steady Horse Noah",
    title: "Virtual Horse Trainer",
    quote: "ConvertCast helped me launch my virtual horse training business. After using it only twice I was booked out for the year!",
    image: "https://cdn.builder.io/api/v1/image/assets%2Fb8ab7eab51514bb59b560f9290a4ad1f%2F75110ae7126740eda631b198446b4592?format=webp",
    results: [
      { metric: "78%", label: "Stayed Until Offer", icon: Users },
      { metric: "40%", label: "Conversion Rate", icon: Target },
      { metric: "$177K", label: "Single Launch", icon: ArrowRight }
    ],
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    id: 2,
    name: "Kathryn Aragon",
    title: "Business Coach",
    quote: "I'm someone who hates hard selling. With ConvertCast I just state my offer and let the software do the work!",
    image: "https://cdn.builder.io/api/v1/image/assets%2Fb8ab7eab51514bb59b560f9290a4ad1f%2Fb604f86572ca42ee81dd581b2533f708",
    results: [
      { metric: "2,400%", label: "Attendance Growth", icon: Users },
      { metric: "89%", label: "Engagement Rate", icon: Target },
      { metric: "25", label: "Appointments/Month", icon: Calendar }
    ],
    gradient: "from-purple-500 to-pink-500"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut"
    }
  }
};

export default function TestimonialsSecond() {
  const [imageErrors, setImageErrors] = useState<{[key: string]: boolean}>({});

  const handleImageError = (testimonialId: number) => {
    setImageErrors(prev => ({
      ...prev,
      [testimonialId]: true
    }));
  };

  return (
    <section className="py-24 bg-gradient-to-b from-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-20 right-20 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], x: [0, 30, 0] }}
          transition={{ duration: 15, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 left-20 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"
          animate={{ scale: [1, 0.8, 1], x: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-2 mb-6">
            <Quote className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300 text-sm font-medium">More Success Stories</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Transforming Businesses{' '}
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Across Industries
            </span>
          </h2>

          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            From horse training to business coaching, ConvertCast delivers results
            that speak for themselves
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <motion.div
          className="grid lg:grid-cols-2 gap-8 mb-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {testimonials.map((testimonial) => (
            <motion.div
              key={testimonial.id}
              className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all duration-300"
              variants={cardVariants}
              whileHover={{ y: -5 }}
            >
              {/* Header with Avatar */}
              <div className="p-8 pb-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-700">
                      {imageErrors[testimonial.id] ? (
                        // Fallback: Initials with gradient background
                        <div className={`w-full h-full bg-gradient-to-r ${testimonial.gradient} flex items-center justify-center`}>
                          <span className="text-white font-bold text-lg">
                            {testimonial.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                      ) : (
                        <Image
                          src={testimonial.image}
                          alt={testimonial.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                          onError={() => handleImageError(testimonial.id)}
                          onLoadingComplete={() => {
                            // Remove any error state if image loads successfully
                            setImageErrors(prev => ({ ...prev, [testimonial.id]: false }));
                          }}
                          priority={false}
                          loading="lazy"
                        />
                      )}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r ${testimonial.gradient} rounded-full flex items-center justify-center`}>
                      <Quote className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{testimonial.name}</h3>
                    <p className="text-gray-400">{testimonial.title}</p>
                    <div className="flex items-center gap-1 mt-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quote */}
                <blockquote className="text-lg text-gray-300 leading-relaxed mb-6">
                  "{testimonial.quote}"
                </blockquote>

                {/* Results */}
                <div className="grid grid-cols-3 gap-4">
                  {testimonial.results.map((result, index) => {
                    const Icon = result.icon;
                    return (
                      <motion.div
                        key={index}
                        className="text-center p-4 bg-slate-800/50 rounded-xl"
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 * index, duration: 0.6 }}
                      >
                        <div className={`w-8 h-8 bg-gradient-to-r ${testimonial.gradient} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div className={`text-2xl font-bold bg-gradient-to-r ${testimonial.gradient} bg-clip-text text-transparent mb-1`}>
                          {result.metric}
                        </div>
                        <div className="text-xs text-gray-400">{result.label}</div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Closed Beta CTA */}
        <motion.div
          className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-3xl p-12 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          {/* Beta Badge */}
          <motion.div
            className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 mb-6"
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
            <span className="text-orange-300 text-sm font-medium">Limited Access</span>
          </motion.div>

          <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
            ConvertCast is in <span className="text-orange-400">Closed Beta</span>
          </h3>

          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            We're currently accepting a limited number of users who are serious about
            transforming their webinar results. Join the waitlist to secure your spot.
          </p>

          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-center gap-2 text-gray-400">
              <Users className="w-4 h-4" />
              <span className="text-sm">Only 127 spots remaining</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-gray-400">
              <Target className="w-4 h-4" />
              <span className="text-sm">Average 3x conversion increase for beta users</span>
            </div>
          </div>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 1.0, duration: 0.6 }}
          >
            <motion.button
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Request an Invite
              <ArrowRight className="w-5 h-5" />
            </motion.button>

            <motion.button
              className="px-8 py-4 border-2 border-gray-600 text-white rounded-lg font-semibold text-lg hover:border-gray-500 transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Watch Demo
            </motion.button>
          </motion.div>

          <div className="mt-8 pt-8 border-t border-slate-700">
            <p className="text-sm text-gray-500">
              Join over 2,000 entrepreneurs on the waitlist •{' '}
              <span className="text-green-400">No spam, just results</span>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
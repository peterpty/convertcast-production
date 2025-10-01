'use client';

import { motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';

// Homepage Components
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/homepage/Hero';
import Problems from '@/components/homepage/Problems';
import Testimonials from '@/components/homepage/Testimonials';
import FeatureShowcase from '@/components/homepage/FeatureShowcase';
import TestimonialsSecond from '@/components/homepage/TestimonialsSecond';

export default function HomePage() {
  return (
    <motion.div
      className="min-h-screen flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <Header />
      <main className="pt-20">
        <Hero />
        <Problems />
        <Testimonials />
        <FeatureShowcase />
        <TestimonialsSecond />
      </main>
      <Footer />
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: 'bg-slate-800 text-white border border-slate-700',
        }}
      />
    </motion.div>
  );
}

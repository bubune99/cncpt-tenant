'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Package, FileText, BarChart3, Mail, Sparkles, Layers, Users } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

const features = [
  {
    icon: Package,
    title: 'Product Management',
    description: 'Manage inventory, variants, pricing, and more',
  },
  {
    icon: FileText,
    title: 'Content & Blog',
    description: 'Rich editor with SEO tools and scheduling',
  },
  {
    icon: Layers,
    title: 'Visual Page Builder',
    description: 'Drag-and-drop editor with 40+ components',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Real-time insights and conversion tracking',
  },
  {
    icon: Mail,
    title: 'Email Marketing',
    description: 'Campaigns, automation, and analytics',
  },
  {
    icon: Sparkles,
    title: 'AI Assistant',
    description: 'Generate content and get intelligent suggestions',
  },
];

export function DemoWelcomePage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-white">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/10 dark:bg-blue-600/20 rounded-full blur-[150px] opacity-50" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-orange-500/10 dark:bg-orange-500/20 rounded-full blur-[150px] opacity-40" />
      </div>

      {/* Header */}
      <header className="relative z-50 py-6 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            {mounted && (
              <Image
                src={resolvedTheme === 'dark' ? '/CNCPT_Web_logo_white.png' : '/CNCPT_Web_logo_navy.png'}
                alt="CNCPT Web"
                width={140}
                height={40}
                className="h-9 w-auto"
                priority
              />
            )}
            {!mounted && (
              <div className="h-9 w-[140px] bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 text-xs font-medium bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-full border border-orange-500/20">
              Demo Mode
            </span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 dark:border-white/[0.1] bg-gray-50 dark:bg-white/[0.03] mb-8">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <span className="text-sm text-gray-600 dark:text-white/60">Interactive Demo</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-gray-900 dark:text-white">
              Welcome to the
              <br />
              <span className="bg-gradient-to-r from-blue-800 via-blue-600 to-orange-500 dark:from-blue-400 dark:via-blue-300 dark:to-orange-400 bg-clip-text text-transparent">
                CNCPT CMS Demo
              </span>
            </h1>

            <p className="text-lg text-gray-600 dark:text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
              Explore the full power of our all-in-one CMS platform. Browse products,
              manage content, view analytics, and discover AI-powered features.
              No sign-up required.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Link
                href="/admin"
                className="group inline-flex items-center gap-3 px-8 py-4 text-lg font-medium bg-gradient-to-r from-blue-800 to-orange-500 text-white rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all"
              >
                Explore the CMS
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="relative py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900 dark:text-white">
              What you can explore
            </h2>
            <p className="text-gray-600 dark:text-white/50">
              This demo includes sample data across all features
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="p-6 rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/[0.04] transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-800 to-orange-500 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 dark:text-white/50">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.02] p-10 text-center"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/10 via-orange-500/10 to-blue-500/10 rounded-3xl blur-xl opacity-50" />
            <div className="relative">
              <Users className="w-12 h-12 mx-auto mb-4 text-orange-500" />
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                Ready to get started?
              </h2>
              <p className="text-gray-600 dark:text-white/50 mb-8 max-w-lg mx-auto">
                Like what you see? Start your free trial and build your own site with CNCPT CMS.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/admin"
                  className="px-6 py-3 font-medium bg-blue-800 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:bg-blue-700 dark:hover:bg-white/90 transition-colors"
                >
                  Continue to Demo
                </Link>
                <Link
                  href="https://cncptweb.com/register"
                  className="px-6 py-3 font-medium rounded-xl border border-gray-200 dark:border-white/[0.1] hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors text-gray-700 dark:text-white"
                >
                  Start Free Trial
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-6 border-t border-gray-200 dark:border-white/[0.06]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center">
            {mounted && (
              <Image
                src={resolvedTheme === 'dark' ? '/CNCPT_Web_logo_white.png' : '/CNCPT_Web_logo_navy.png'}
                alt="CNCPT Web"
                width={100}
                height={30}
                className="h-7 w-auto"
              />
            )}
            {!mounted && (
              <div className="h-7 w-[100px] bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            )}
          </div>
          <p className="text-sm text-gray-400 dark:text-white/30">
            &copy; {new Date().getFullYear()} CNCPT Web. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

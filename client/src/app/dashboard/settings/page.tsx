"use client";

import { motion } from "motion/react";
import { useSession } from "@/lib/auth-client";
import { ThemeToggle } from "@/components/theme-toggle";

export default function SettingsPage() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col px-6 py-6"
    >
      <h2 className="font-heading text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Settings
      </h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Manage your account preferences
      </p>

      <div className="mt-8 space-y-8">
        <section>
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Profile
          </h3>
          <div className="mt-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-200 text-lg font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                {user?.name?.charAt(0) ?? "?"}
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {user?.name ?? "User"}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {user?.email ?? ""}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Appearance
          </h3>
          <div className="mt-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-900 dark:text-zinc-100">
                  Theme
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Toggle between light and dark mode
                </p>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            About
          </h3>
          <div className="mt-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Papermind — AI-powered document research, Q&A, and content generation.
            </p>
          </div>
        </section>
      </div>
    </motion.div>
  );
}

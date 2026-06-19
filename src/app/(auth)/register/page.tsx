"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { signUp, signIn } from "@/lib/auth-client";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!form.username || form.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9]+$/.test(form.username)) {
      newErrors.username = "Username can only contain letters and numbers";
    } else if (form.username.length > 20) {
      newErrors.username = "Username must be 20 characters or less";
    }

    if (!form.name || form.name.length < 1) {
      newErrors.name = "Display name is required";
    }

    if (!form.email) {
      newErrors.email = "Email is required";
    }

    if (form.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await signUp.email({
        email: form.email,
        password: form.password,
        name: form.name,
        username: form.username,
      });

      if (result.error) {
        setErrors({ form: result.error.message || "Registration failed" });
      } else {
        router.push("/home");
        router.refresh();
      }
    } catch {
      setErrors({ form: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-[var(--radius-lg)] bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center">
            <span className="text-white font-bold text-xl">A</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Create your account
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Start building your media identity
        </p>
      </div>

      {/* Register form */}
      <div className="glass-strong p-6 rounded-[var(--radius-xl)]">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Username"
            placeholder="cinephile42"
            value={form.username}
            onChange={(e) => updateField("username", e.target.value)}
            error={errors.username}
            helperText="3-20 characters, letters and numbers only"
            required
            autoComplete="username"
          />

          <Input
            label="Display Name"
            placeholder="Jane Doe"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            error={errors.name}
            required
            autoComplete="name"
          />

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            error={errors.email}
            required
            autoComplete="email"
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => updateField("password", e.target.value)}
            error={errors.password}
            helperText="At least 8 characters"
            required
            autoComplete="new-password"
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            value={form.confirmPassword}
            onChange={(e) => updateField("confirmPassword", e.target.value)}
            error={errors.confirmPassword}
            required
            autoComplete="new-password"
          />

          {errors.form && (
            <div className="px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-error-muted)] text-[var(--color-error)] text-sm">
              {errors.form}
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full mt-2">
            <UserPlus size={16} />
            Create Account
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 border-t border-[var(--border-secondary)]" />
          <span className="text-xs text-[var(--text-muted)]">or</span>
          <div className="flex-1 border-t border-[var(--border-secondary)]" />
        </div>

        {/* Google OAuth */}
        <Button
          variant="secondary"
          className="w-full"
          onClick={() =>
            signIn.social({ provider: "google", callbackURL: "/home" })
          }
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </Button>
      </div>

      {/* Login link */}
      <p className="text-center mt-6 text-sm text-[var(--text-secondary)]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] font-medium transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

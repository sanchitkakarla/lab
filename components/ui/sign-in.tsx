'use client'

import { cn } from "@/lib/utils"
import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, useMemo, useCallback, createContext, Children } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { ArrowRight, Mail, Lock, Eye, EyeOff } from "lucide-react"
import { AnimatePresence, motion, useInView, Variants, Transition } from "framer-motion"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { LiquidButton } from "@/components/ui/liquid-glass-button"

// --- TEXT LOOP ---
type TextLoopProps = { children: React.ReactNode[]; className?: string; interval?: number; transition?: Transition; variants?: Variants; onIndexChange?: (index: number) => void; stopOnEnd?: boolean }
function TextLoop({ children, className, interval = 2, transition = { duration: 0.3 }, variants, onIndexChange, stopOnEnd = false }: TextLoopProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const items = Children.toArray(children)
  useEffect(() => {
    const ms = interval * 1000
    const timer = setInterval(() => {
      setCurrentIndex((current) => {
        if (stopOnEnd && current === items.length - 1) { clearInterval(timer); return current }
        const next = (current + 1) % items.length
        onIndexChange?.(next)
        return next
      })
    }, ms)
    return () => clearInterval(timer)
  }, [items.length, interval, onIndexChange, stopOnEnd])
  const motionVariants: Variants = { initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { y: -20, opacity: 0 } }
  return (
    <div className={cn("relative inline-block whitespace-nowrap", className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div key={currentIndex} initial="initial" animate="animate" exit="exit" transition={transition} variants={variants || motionVariants}>
          {items[currentIndex]}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// --- BLUR FADE ---
function BlurFade({ children, className, duration = 0.4, delay = 0, yOffset = 6, inView = true, blur = "6px" }: { children: React.ReactNode; className?: string; duration?: number; delay?: number; yOffset?: number; inView?: boolean; blur?: string }) {
  const ref = useRef(null)
  const inViewResult = useInView(ref, { once: true })
  const isInView = !inView || inViewResult
  const defaultVariants: Variants = {
    hidden: { y: yOffset, opacity: 0, filter: `blur(${blur})` },
    visible: { y: -yOffset, opacity: 1, filter: "blur(0px)" },
  }
  return (
    <motion.div ref={ref} initial="hidden" animate={isInView ? "visible" : "hidden"} exit="hidden" variants={defaultVariants} transition={{ delay: 0.04 + delay, duration, ease: "easeOut" }} className={className}>
      {children}
    </motion.div>
  )
}

// --- GLASS BUTTON ---
const glassButtonVariants = cva("relative isolate all-unset cursor-pointer rounded-full transition-all", { variants: { size: { default: "text-base font-medium", sm: "text-sm font-medium", lg: "text-lg font-medium", icon: "h-10 w-10" } }, defaultVariants: { size: "default" } })
const glassButtonTextVariants = cva("glass-button-text relative block select-none tracking-tighter", { variants: { size: { default: "px-6 py-3.5", sm: "px-4 py-2", lg: "px-8 py-4", icon: "flex h-10 w-10 items-center justify-center" } }, defaultVariants: { size: "default" } })
interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof glassButtonVariants> { contentClassName?: string }
const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(({ className, children, size, contentClassName, onClick, ...props }, ref) => {
  const handleWrapperClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const button = e.currentTarget.querySelector("button")
    if (button && e.target !== button) button.click()
  }
  return (
    <div className={cn("glass-button-wrap cursor-pointer rounded-full relative", className)} onClick={handleWrapperClick}>
      <button className={cn("glass-button relative z-10", glassButtonVariants({ size }))} ref={ref} onClick={onClick} {...props}>
        <span className={cn(glassButtonTextVariants({ size }), contentClassName)}>{children}</span>
      </button>
      <div className="glass-button-shadow rounded-full pointer-events-none" />
    </div>
  )
})
GlassButton.displayName = "GlassButton"

// --- DENTAL LAB LOGO ---
const LabLogo = () => (
  <div className="flex items-center gap-2">
    <div className="bg-gray-900 text-white rounded-lg p-2">
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    </div>
    <span className="font-bold text-gray-900 text-base">Dental Lab</span>
  </div>
)

// --- MAIN LOGIN COMPONENT ---
export function SignIn() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [authStep, setAuthStep] = useState<"email" | "password">("email")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const isEmailValid = /\S+@\S+\.\S+/.test(email)
  const isPasswordValid = password.length >= 6
  const passwordInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (authStep === "password") setTimeout(() => passwordInputRef.current?.focus(), 400)
  }, [authStep])

  function handleProgressStep() {
    if (authStep === "email" && isEmailValid) {
      setError("")
      setAuthStep("password")
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      if (authStep === "email") handleProgressStep()
      else if (authStep === "password" && isPasswordValid) handleLogin()
    }
  }

  async function handleLogin() {
    setError("")
    setLoading(true)

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError || !data.session) {
      setError(authError?.message ?? "Invalid email or password")
      setLoading(false)
      return
    }

    // Check if lab staff (RLS allows users to read their own profile row)
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", data.session.user.id)
      .single()

    // Use hard navigation so session cookie is sent with the next request
    // and middleware can properly verify the role
    if (profile) {
      window.location.href = "/dashboard"
      return
    }

    // Not staff — go to portal; middleware will verify portal_enabled via admin client
    window.location.href = "/portal"
  }

  return (
    <div className="min-h-screen w-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #dde8ff 0%, #e8d8ff 30%, #cfe8ff 60%, #d4f0f8 100%)' }}>
      <style>{`
        @property --angle-1 { syntax: "<angle>"; inherits: false; initial-value: -75deg; }
        @property --angle-2 { syntax: "<angle>"; inherits: false; initial-value: -45deg; }
        .glass-button-wrap { --anim-time: 400ms; --anim-ease: cubic-bezier(0.25, 1, 0.5, 1); --border-width: clamp(1px, 0.0625em, 4px); position: relative; z-index: 2; transform-style: preserve-3d; transition: transform var(--anim-time) var(--anim-ease); }
        .glass-button-wrap:has(.glass-button:active) { transform: rotateX(25deg); }
        .glass-button-shadow { --shadow-cutoff-fix: 2em; position: absolute; width: calc(100% + var(--shadow-cutoff-fix)); height: calc(100% + var(--shadow-cutoff-fix)); top: calc(0% - var(--shadow-cutoff-fix) / 2); left: calc(0% - var(--shadow-cutoff-fix) / 2); filter: blur(clamp(2px, 0.125em, 12px)); transition: filter var(--anim-time) var(--anim-ease); pointer-events: none; z-index: 0; }
        .glass-button-shadow::after { content: ""; position: absolute; inset: 0; border-radius: 9999px; background: linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.08)); width: calc(100% - var(--shadow-cutoff-fix) - 0.25em); height: calc(100% - var(--shadow-cutoff-fix) - 0.25em); top: calc(var(--shadow-cutoff-fix) - 0.5em); left: calc(var(--shadow-cutoff-fix) - 0.875em); padding: 0.125em; box-sizing: border-box; mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); mask-composite: exclude; }
        .glass-button { -webkit-tap-highlight-color: transparent; backdrop-filter: blur(4px); transition: all var(--anim-time) var(--anim-ease); background: linear-gradient(-75deg, rgba(255,255,255,0.05), rgba(255,255,255,0.2), rgba(255,255,255,0.05)); box-shadow: inset 0 1px 2px rgba(0,0,0,0.08), inset 0 -1px 2px rgba(255,255,255,0.5), 0 4px 8px -2px rgba(0,0,0,0.15), 0 0 0 1px inset rgba(255,255,255,0.2); }
        .glass-button:hover { transform: scale(0.975); }
        .glass-button-text { color: rgba(17,24,39,0.9); text-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all var(--anim-time) var(--anim-ease); }
        .glass-button-text::after { content: ""; display: block; position: absolute; width: calc(100% - var(--border-width)); height: calc(100% - var(--border-width)); top: calc(0% + var(--border-width) / 2); left: calc(0% + var(--border-width) / 2); box-sizing: border-box; border-radius: 9999px; overflow: clip; background: linear-gradient(var(--angle-2), transparent 0%, rgba(255,255,255,0.5) 40% 50%, transparent 55%); z-index: 3; mix-blend-mode: screen; pointer-events: none; background-size: 200% 200%; background-position: 0% 50%; transition: background-position 500ms cubic-bezier(0.25,1,0.5,1), --angle-2 500ms; }
        .glass-button:hover .glass-button-text::after { background-position: 25% 50%; }
        .glass-button::after { content: ""; position: absolute; z-index: 1; inset: 0; border-radius: 9999px; width: calc(100% + var(--border-width)); height: calc(100% + var(--border-width)); top: calc(0% - var(--border-width) / 2); left: calc(0% - var(--border-width) / 2); padding: var(--border-width); box-sizing: border-box; background: conic-gradient(from var(--angle-1) at 50% 50%, rgba(0,0,0,0.3) 0%, transparent 5% 40%, rgba(0,0,0,0.3) 50%, transparent 60% 95%, rgba(0,0,0,0.3) 100%), linear-gradient(180deg, rgba(255,255,255,0.5), rgba(255,255,255,0.5)); mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); mask-composite: exclude; transition: all var(--anim-time) var(--anim-ease), --angle-1 500ms ease; pointer-events: none; }
        .glass-button:hover::after { --angle-1: -125deg; }
        .glass-input-wrap { position: relative; z-index: 2; border-radius: 9999px; }
        .glass-input { display: flex; position: relative; width: 100%; align-items: center; gap: 0.5rem; border-radius: 9999px; padding: 0.25rem; backdrop-filter: blur(4px); transition: all 400ms cubic-bezier(0.25,1,0.5,1); background: linear-gradient(-75deg, rgba(255,255,255,0.05), rgba(255,255,255,0.2), rgba(255,255,255,0.05)); box-shadow: inset 0 1px 2px rgba(0,0,0,0.06), inset 0 -1px 2px rgba(255,255,255,0.4), 0 4px 8px -2px rgba(0,0,0,0.12), 0 0 0 1px inset rgba(0,0,0,0.08); }
        .glass-input::after { content: ""; position: absolute; z-index: 1; inset: 0; border-radius: 9999px; width: calc(100% + 1px); height: calc(100% + 1px); top: -0.5px; left: -0.5px; padding: 1px; box-sizing: border-box; background: conic-gradient(from var(--angle-1) at 50% 50%, rgba(0,0,0,0.25) 0%, transparent 5% 40%, rgba(0,0,0,0.25) 50%, transparent 60% 95%, rgba(0,0,0,0.25) 100%), linear-gradient(180deg, rgba(255,255,255,0.4), rgba(255,255,255,0.4)); mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); mask-composite: exclude; transition: all 400ms cubic-bezier(0.25,1,0.5,1), --angle-1 500ms ease; pointer-events: none; }
        .glass-input-wrap:focus-within .glass-input::after { --angle-1: -125deg; }
        .glass-input-text-area { position: absolute; inset: 0; border-radius: 9999px; pointer-events: none; }
      `}</style>

      {/* Header */}
      <div className="fixed top-5 left-6 z-20">
        <LabLogo />
      </div>

      {/* Main */}
      <div className="flex w-full flex-1 min-h-screen items-center justify-center relative overflow-hidden">
        {/* Floating orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div style={{ position: 'absolute', top: '-15%', left: '-10%',  width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,180,255,0.50) 0%, transparent 70%)', filter: 'blur(60px)' }} />
          <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: 650, height: 650, borderRadius: '50%', background: 'radial-gradient(circle, rgba(180,140,255,0.45) 0%, transparent 70%)', filter: 'blur(60px)' }} />
          <div style={{ position: 'absolute', top: '40%', left: '35%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(100,200,255,0.40) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        </div>

        <fieldset disabled={loading} className="glass-card relative z-10 flex flex-col items-center gap-8 w-[340px] mx-auto p-8">

          <AnimatePresence mode="wait">
            {authStep === "email" && (
              <motion.div key="email-heading" initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} className="w-full flex flex-col items-center gap-4">
                <BlurFade delay={0.1} className="w-full">
                  <p className="font-serif font-light text-5xl tracking-tight text-gray-900 text-center leading-tight">
                    Get started<br />with us
                  </p>
                </BlurFade>
                <BlurFade delay={0.2}>
                  <p className="text-sm text-gray-400 text-center">Sign in to your lab account</p>
                </BlurFade>
              </motion.div>
            )}
            {authStep === "password" && (
              <motion.div key="password-heading" initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} className="w-full flex flex-col items-center text-center gap-3">
                <BlurFade delay={0} className="w-full">
                  <p className="font-serif font-light text-5xl tracking-tight text-gray-900 leading-tight">
                    Welcome<br />back
                  </p>
                </BlurFade>
                <BlurFade delay={0.15}>
                  <p className="text-sm text-gray-400">{email}</p>
                </BlurFade>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="w-full space-y-5">

            {/* Email field */}
            <AnimatePresence mode="wait">
              <BlurFade delay={authStep === "email" ? 0.3 : 0} key="email-field" className="w-full">
                <div className="relative w-full">
                  <AnimatePresence>
                    {authStep === "password" && (
                      <motion.div initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.25, delay: 0.3 }} className="absolute -top-5 left-4 z-10">
                        <label className="text-xs text-gray-400 font-semibold">Email</label>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="glass-input-wrap w-full">
                    <div className="glass-input">
                      <span className="glass-input-text-area" />
                      <div className={cn("relative z-10 flex-shrink-0 flex items-center justify-center overflow-hidden transition-all duration-300", email.length > 20 && authStep === "email" ? "w-0 px-0" : "w-10 pl-2")}>
                        <Mail className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      </div>
                      <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onKeyDown={handleKeyDown}
                        readOnly={authStep === "password"}
                        className="relative z-10 h-full w-0 flex-grow bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none text-sm py-3"
                      />
                      <div className={cn("relative z-10 flex-shrink-0 overflow-hidden transition-all duration-300", isEmailValid && authStep === "email" ? "w-10 pr-1" : "w-0")}>
                        <GlassButton type="button" onClick={handleProgressStep} size="icon" contentClassName="text-gray-700">
                          <ArrowRight className="w-4 h-4" />
                        </GlassButton>
                      </div>
                    </div>
                  </div>
                </div>
              </BlurFade>
            </AnimatePresence>

            {/* Password field */}
            <AnimatePresence>
              {authStep === "password" && (
                <BlurFade key="password-field" className="w-full">
                  <div className="relative w-full">
                    <AnimatePresence>
                      {password.length > 0 && (
                        <motion.div initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.25 }} className="absolute -top-5 left-4 z-10">
                          <label className="text-xs text-gray-400 font-semibold">Password</label>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="glass-input-wrap w-full">
                      <div className="glass-input">
                        <span className="glass-input-text-area" />
                        <div className="relative z-10 flex-shrink-0 flex items-center justify-center w-10 pl-2">
                          {isPasswordValid
                            ? <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full">
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            : <Lock className="h-5 w-5 text-gray-500 flex-shrink-0" />
                          }
                        </div>
                        <input
                          ref={passwordInputRef}
                          type={showPassword ? "text" : "password"}
                          placeholder="Password"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="relative z-10 h-full w-0 flex-grow bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none text-sm py-3"
                        />
                      </div>
                    </div>

                    {error && (
                      <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-3 text-xs text-red-500 text-center">
                        {error}
                      </motion.p>
                    )}

                    <AnimatePresence>
                      {isPasswordValid && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="mt-4 flex justify-center">
                          <LiquidButton
                            type="button"
                            size="lg"
                            onClick={handleLogin}
                            disabled={loading}
                            className="px-10 text-gray-800 font-semibold tracking-tight"
                          >
                            {loading ? "Signing in…" : "Sign in"}
                          </LiquidButton>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <motion.button
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                      type="button"
                      onClick={() => { setAuthStep("email"); setPassword(""); setError("") }}
                      className="mt-4 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      ← Use a different email
                    </motion.button>
                  </div>
                </BlurFade>
              )}
            </AnimatePresence>

            {loading && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-gray-400 text-center">
                Signing in…
              </motion.p>
            )}
          </div>
        </fieldset>
      </div>
    </div>
  )
}

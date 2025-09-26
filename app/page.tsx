"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import {
  CheckCircle,
  Scale,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { useUTMTracking } from "@/hooks/use-utm-tracking";
import { RedirectButton } from "@/components/redirect-button";

interface FormData {
  email: string;
  name: string;
  overallUsefulness: number;
  clientCommunicationImpact: string;
  reliability: number;
  valuePerception: string;
  nextTools: string[];
  firmProfile: string;
  earlyAccessInvitation: string;
}

interface FormErrors {
  email?: string;
  name?: string;
  clientCommunicationImpact?: string;
  valuePerception?: string;
  nextTools?: string;
  firmProfile?: string;
  earlyAccessInvitation?: string;
}

const TOTAL_STEPS = 4;

export default function FeedbackForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const utmParams = useUTMTracking();

  const [formData, setFormData] = useState<FormData>({
    email: "",
    name: "",
    overallUsefulness: 5,
    clientCommunicationImpact: "",
    reliability: 5,
    valuePerception: "",
    nextTools: [],
    firmProfile: "",
    earlyAccessInvitation: "",
  });

  // NEW: ref and helper to smoothly scroll to the form
  const formRef = useRef<HTMLDivElement | null>(null);
  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field in errors && errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};

    switch (step) {
      case 1:
        if (!formData.email) {
          newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = "Please enter a valid email address";
        }

        if (!formData.name.trim()) {
          newErrors.name = "Name is required";
        } else if (formData.name.trim().length < 2) {
          newErrors.name = "Name must be at least 2 characters";
        }
        break;

      case 2:
        if (!formData.clientCommunicationImpact) {
          newErrors.clientCommunicationImpact = "Please select an option";
        }
        break;

      case 3:
        if (!formData.valuePerception) {
          newErrors.valuePerception = "Please select an option";
        }
        if (formData.nextTools.length === 0) {
          newErrors.nextTools = "Please select at least one tool";
        }
        break;

      case 4:
        if (!formData.firmProfile) {
          newErrors.firmProfile = "Please select your firm type";
        }
        if (!formData.earlyAccessInvitation) {
          newErrors.earlyAccessInvitation = "Please select an option";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < TOTAL_STEPS) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setErrors({});
        setIsAnimating(false);
      }, 200);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setIsSubmitting(true);
    setSubmitError(null);
    const supabase = createClient();

    try {
      // 1) Salva no Supabase (como já fazia)
      const { error } = await supabase.from("feedback_responses").insert({
        email: formData.email,
        name: formData.name,
        overall_usefulness: formData.overallUsefulness,
        client_communication_impact: formData.clientCommunicationImpact,
        reliability: formData.reliability,
        value_perception: formData.valuePerception,
        next_tools: formData.nextTools,
        firm_profile: formData.firmProfile,
        early_access_invitation: formData.earlyAccessInvitation,
        utm_source: utmParams.utm_source,
        utm_medium: utmParams.utm_medium,
        utm_campaign: utmParams.utm_campaign,
        utm_term: utmParams.utm_term,
        utm_content: utmParams.utm_content,
        referrer: utmParams.referrer,
        landing_page: utmParams.landing_page,
      });

      if (error) throw error;

      // 2) Mapeia campos para os labels EXATOS do Kit (baseado na resposta da API)
      const kitFields: Record<string, string> = {
        usefuldemo: String(formData.overallUsefulness ?? ""),
        complaints: formData.clientCommunicationImpact || "",
        reliability: String(formData.reliability ?? ""),
        cost: formData.valuePerception || "",
        firmtype: formData.firmProfile || "",
        foundingpartner: formData.earlyAccessInvitation || "",
        wichautomation: (formData.nextTools || []).join(", "),
        "Date of Creation": new Date().toISOString(),
      };

      // 3) Envia para o Kit.com
      const kitResponse = await fetch("/api/kit/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          fields: kitFields,
          referrer: utmParams.referrer,
        }),
      });

      if (!kitResponse.ok) {
        const { error: kitError } = await kitResponse.json();
        console.warn("Kit.com submission failed:", kitError);
        // Não falha o processo se o Kit falhar, apenas loga o erro
      }

      setIsSubmitted(true);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setSubmitError(
        "There was an error submitting your feedback. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextToolsChange = (tool: string, checked: boolean) => {
    if (checked) {
      updateFormData("nextTools", [...formData.nextTools, tool]);
    } else {
      updateFormData(
        "nextTools",
        formData.nextTools.filter((t) => t !== tool)
      );
    }
  };

  const ErrorMessage = ({ error }: { error?: string }) => {
    if (!error) return null;
    return (
      <div className="flex items-center gap-2 text-destructive text-sm mt-1">
        <AlertCircle className="w-4 h-4" />
        <span>{error}</span>
      </div>
    );
  };

  const progress = (currentStep / TOTAL_STEPS) * 100;

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute top-1/2 right-1/3 w-64 h-64 bg-teal-400/15 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        <Card className="w-full max-w-4xl bg-white/80 backdrop-blur-xl border border-white/30 shadow-2xl animate-fade-in mx-2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/50"></div>

          <CardHeader className="text-center pb-8 relative z-10">
            <div className="relative mx-auto mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-2xl opacity-30 scale-150"></div>
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl">
                <CheckCircle className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-white animate-bounce" />
              </div>
            </div>

            <CardTitle className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-balance bg-gradient-to-r from-green-700 via-emerald-700 to-teal-700 bg-clip-text text-transparent mb-3 sm:mb-4 px-2 sm:px-0">
              🎉 Thank you for your feedback!
            </CardTitle>
            <CardDescription className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto px-2 sm:px-0 leading-relaxed">
              You've successfully unlocked your{" "}
              <span className="font-semibold text-emerald-600">
                Free Triage App
              </span>
              ! Here's what happens next:
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 md:px-8 lg:px-12 pb-6 sm:pb-8 relative z-10">
            <div className="space-y-4 sm:space-y-6">
              {[
                {
                  title: "Free Triage App Unlocked",
                  desc: "You'll immediately unlock the Free Triage App (manual demo version) so you can optimize your intake immediately without spending a dime.",
                  icon: "🎁",
                  color: "from-green-500 to-emerald-500",
                },
                {
                  title: "Early Access Priority",
                  desc: "You'll be added to our Early Access list for the complete Legal AI Launchpad™ stack with priority access to new features.",
                  icon: "🚀",
                  color: "from-blue-500 to-indigo-500",
                },
                {
                  title: "Shape Our Future",
                  desc: "Your feedback directly influences which automation we build first for our law firm subscribers. You're helping shape the future of legal tech!",
                  icon: "⭐",
                  color: "from-purple-500 to-pink-500",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row items-start gap-3 sm:gap-6 p-4 sm:p-6 bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/40 shadow-lg animate-slide-up hover:shadow-xl transition-all duration-300"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r ${item.color} rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg mx-auto sm:mx-0`}
                  >
                    <span className="text-white text-base sm:text-lg md:text-xl">
                      {item.icon}
                    </span>
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl text-white text-center">
              <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3">
                Ready to get started?
              </h3>
              <p className="text-sm sm:text-base text-blue-100 mb-3 sm:mb-4 leading-relaxed">
                Check your email for your Free Triage App access and next steps.
              </p>
              <div className="flex items-center justify-center gap-2 text-blue-200 mb-6">
                <span className="text-xs sm:text-sm">📧</span>
                <span className="text-xs sm:text-sm">
                  We'll be in touch within 24 hours
                </span>
              </div>

              {/* Redirect Button with Timer */}
              <div className="mt-6 px-2">
                <h4 className="text-sm sm:text-base text-blue-100 mb-4 font-medium">
                  Access your Free Triage App now:
                </h4>
                <div className="flex justify-center">
                  <RedirectButton
                    url="https://law-sphere-pro-intake.lovable.app/"
                    className="bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Launch Free Triage App
                  </RedirectButton>
                </div>
                <p className="text-xs text-blue-200 mt-3 text-center">
                  You'll be redirected automatically in 30 seconds
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 min-h-screen">
      {/* HERO full-screen section */}
      <section className="relative min-h-screen flex items-center justify-center px-3 sm:px-4 py-6 sm:py-8 md:py-12 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute top-1/2 right-1/3 w-64 h-64 bg-purple-400/15 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        <div className="max-w-5xl mx-auto text-center animate-fade-in relative z-10">
          {/* Logo with modern styling */}
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur-xl opacity-30 scale-110"></div>
            <img
              src="/gavel.png"
              alt="Gavel"
              className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 mx-auto animate-swing mb-6 filter drop-shadow-2xl"
            />
          </div>

          {/* Hero Text */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-balance leading-tight px-2 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-4">
              Vote on the Next Legal AI Tool
            </h1>
            <p className="text-lg sm:text-lg sm:text-xl md:text-2xl text-slate-600 font-medium mb-2">
              Unlock Your Free Triage App
            </p>
            <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto">
              Shape the future of legal automation with just 2 minutes of your
              time
            </p>
          </div>

          {/* Modern Card with Glassmorphism */}
          <Card className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-2xl mx-2 sm:mx-0 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
            <CardContent className="relative p-6 sm:p-8 md:p-10 lg:p-12 text-left space-y-6">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
                  <Scale className="w-4 h-4" />
                  Legal AI Innovation
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <p className="text-base sm:text-lg leading-relaxed text-slate-700">
                    We're building an{" "}
                    <span className="font-semibold text-blue-600">
                      automation stack for lawyers
                    </span>{" "}
                    that converts missed calls into consultations, reviews into
                    revenue, and leads into paying clients — automatically.
                  </p>
                  <p className="text-base sm:text-lg leading-relaxed text-slate-700">
                    <span className="font-semibold text-indigo-600">
                      Lawyer Connect™
                    </span>{" "}
                    was the first step. Your 2 minutes of feedback not only
                    shapes what comes next…
                  </p>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-2xl text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-lg">🎯</span>
                      </div>
                      <h3 className="text-lg font-bold">Exclusive Bonus</h3>
                    </div>
                    <p className="text-blue-100 leading-relaxed">
                      You'll also unlock a{" "}
                      <span className="font-semibold text-white">
                        Free Triage App
                      </span>{" "}
                      (manual demo version) so you can optimize your intake
                      immediately without spending a dime.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <Button
                  size="lg"
                  onClick={scrollToForm}
                  className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-h-[48px] sm:min-h-[56px]"
                >
                  Start the 2‑minute survey
                  <ArrowRight className="w-5 h-5 ml-3 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FORM section */}
      <section
        ref={formRef}
        className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 bg-gradient-to-b from-slate-50 to-white"
      >
        <div className="max-w-5xl mx-auto">
          {/* Modern Progress Section */}
          <div className="mb-8 sm:mb-12 animate-slide-up">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex justify-between items-center text-sm font-medium text-slate-600 mb-4">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  Step {currentStep} of {TOTAL_STEPS}
                </span>
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-bold">
                  {Math.round(progress)}% Complete
                </span>
              </div>

              <Progress value={progress} className="h-3 mb-6 bg-slate-200" />

              <div className="flex justify-between">
                {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                  <div
                    key={i}
                    className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300 transform ${
                      i + 1 < currentStep
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg scale-110"
                        : i + 1 === currentStep
                        ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg scale-110"
                        : "bg-slate-200 text-slate-500 hover:bg-slate-300"
                    }`}
                  >
                    {i + 1 < currentStep ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      i + 1
                    )}
                    {i + 1 === currentStep && (
                      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl blur opacity-30"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Card className="bg-white/90 backdrop-blur-xl border border-white/30 shadow-2xl transition-all duration-500 hover:shadow-3xl">
            <CardContent className="p-4 sm:p-6 md:p-8 lg:p-10">
              {currentStep === 1 && (
                <div className="space-y-6 sm:space-y-8 animate-fade-in">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Step 1 of 4
                    </div>
                    <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                      Contact Information
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
                      Let's start with your basic information so we can keep you
                      updated on our progress
                    </CardDescription>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="animate-slide-up space-y-3">
                      <Label
                        htmlFor="email"
                        className="text-sm font-semibold text-slate-700 flex items-center gap-2"
                      >
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={(e) =>
                          updateFormData("email", e.target.value)
                        }
                        className={`h-11 sm:h-12 text-sm sm:text-base border-2 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-blue-100 ${
                          errors.email
                            ? "border-red-300 bg-red-50"
                            : "border-slate-200 focus:border-blue-500"
                        }`}
                      />
                      <ErrorMessage error={errors.email} />
                    </div>

                    <div
                      className="animate-slide-up space-y-3"
                      style={{ animationDelay: "0.1s" }}
                    >
                      <Label
                        htmlFor="name"
                        className="text-sm font-semibold text-slate-700 flex items-center gap-2"
                      >
                        <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Your full name"
                        value={formData.name}
                        onChange={(e) => updateFormData("name", e.target.value)}
                        className={`h-11 sm:h-12 text-sm sm:text-base border-2 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-indigo-100 ${
                          errors.name
                            ? "border-red-300 bg-red-50"
                            : "border-slate-200 focus:border-indigo-500"
                        }`}
                      />
                      <ErrorMessage error={errors.name} />
                    </div>
                  </div>

                  <div
                    className="flex justify-center animate-slide-up pt-4"
                    style={{ animationDelay: "0.2s" }}
                  >
                    <Button
                      onClick={nextStep}
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-base sm:text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-h-[48px] sm:min-h-[48px] sm:min-h-[56px]"
                    >
                      Continue to Experience
                      <ArrowRight className="w-5 h-5 ml-3 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6 sm:space-y-8 animate-fade-in">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      Step 2 of 4
                    </div>
                    <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                      Your Experience
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
                      Tell us about your experience with Lawyer Connect™ so we
                      can improve
                    </CardDescription>
                  </div>

                  <div className="space-y-8">
                    <div className="animate-slide-up">
                      <Label className="text-base sm:text-base sm:text-lg font-semibold block mb-4 sm:mb-6 text-slate-800 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0">
                          1
                        </div>
                        <span>
                          On a scale of 1–10, how useful was the Lawyer Connect
                          demo for your firm?
                        </span>
                      </Label>
                      <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-6 rounded-2xl border border-slate-200">
                        <div className="flex items-center justify-between mb-3 sm:mb-4 text-xs sm:text-sm font-medium text-slate-600">
                          <span className="flex items-center gap-1 sm:gap-2">
                            <span className="text-red-500">😞</span>
                            <span className="hidden sm:inline">Not useful</span>
                            <span className="sm:hidden">Not useful</span>
                          </span>
                          <span className="flex items-center gap-1 sm:gap-2">
                            <span className="text-green-500">😍</span>
                            <span className="hidden sm:inline">
                              Very useful
                            </span>
                            <span className="sm:hidden">Very useful</span>
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={formData.overallUsefulness}
                          onChange={(e) =>
                            updateFormData(
                              "overallUsefulness",
                              Number.parseInt(e.target.value)
                            )
                          }
                          className="w-full h-3 sm:h-4 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 rounded-full appearance-none cursor-pointer slider"
                          style={{
                            background: `linear-gradient(to right, #ef4444 0%, #f59e0b 50%, #22c55e 100%)`,
                          }}
                        />
                        <div className="text-center mt-4 sm:mt-6">
                          <span className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 text-lg sm:text-2xl font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-lg">
                            {formData.overallUsefulness}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      className="animate-slide-up"
                      style={{ animationDelay: "0.1s" }}
                    >
                      <Label className="text-base sm:text-lg font-semibold block mb-4 sm:mb-6 text-slate-800 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0">
                          2
                        </div>
                        <span>
                          Since trying Lawyer Connect™, have client complaints
                          about lack of updates decreased?
                        </span>
                      </Label>
                      <div className="bg-gradient-to-br from-slate-50 to-emerald-50 p-4 sm:p-6 rounded-2xl border border-slate-200">
                        <RadioGroup
                          value={formData.clientCommunicationImpact}
                          onValueChange={(value) =>
                            updateFormData("clientCommunicationImpact", value)
                          }
                          className="space-y-3 sm:space-y-4"
                        >
                          {[
                            {
                              value: "yes_noticeably",
                              label: "Yes, noticeably",
                              icon: "🎉",
                            },
                            {
                              value: "somewhat",
                              label: "Somewhat",
                              icon: "👍",
                            },
                            {
                              value: "no_change",
                              label: "No change",
                              icon: "😐",
                            },
                            {
                              value: "too_early_to_tell",
                              label: "Too early to tell",
                              icon: "⏰",
                            },
                          ].map((option) => (
                            <div
                              key={option.value}
                              className="flex items-center space-x-4 p-4 rounded-xl border-2 border-transparent hover:border-blue-200 hover:bg-blue-50/50 transition-all duration-200 cursor-pointer group"
                            >
                              <RadioGroupItem
                                value={option.value}
                                id={option.value}
                                className="w-6 h-6 border-2 border-slate-300 group-hover:border-blue-400"
                              />
                              <Label
                                htmlFor={option.value}
                                className="text-base cursor-pointer flex-1 flex items-center gap-2 sm:gap-3 font-medium text-slate-700"
                              >
                                <span className="text-lg sm:text-xl">
                                  {option.icon}
                                </span>
                                {option.label}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                      <ErrorMessage error={errors.clientCommunicationImpact} />
                    </div>

                    <div
                      className="animate-slide-up"
                      style={{ animationDelay: "0.2s" }}
                    >
                      <Label className="text-base sm:text-base sm:text-lg font-semibold block mb-4 sm:mb-6 text-slate-800 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0">
                          3
                        </div>
                        <span>
                          On a scale of 1–10, how reliable was Lawyer Connect™
                          (accuracy, speed, consistency)?
                        </span>
                      </Label>
                      <div className="bg-gradient-to-br from-slate-50 to-purple-50 p-4 sm:p-6 rounded-2xl border border-slate-200">
                        <div className="flex items-center justify-between mb-3 sm:mb-4 text-xs sm:text-sm font-medium text-slate-600">
                          <span className="flex items-center gap-1 sm:gap-2">
                            <span className="text-red-500">⚡</span>
                            <span className="hidden sm:inline">
                              Not reliable
                            </span>
                            <span className="sm:hidden">Not reliable</span>
                          </span>
                          <span className="flex items-center gap-1 sm:gap-2">
                            <span className="text-green-500">🚀</span>
                            <span className="hidden sm:inline">
                              Very reliable
                            </span>
                            <span className="sm:hidden">Very reliable</span>
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={formData.reliability}
                          onChange={(e) =>
                            updateFormData(
                              "reliability",
                              Number.parseInt(e.target.value)
                            )
                          }
                          className="w-full h-3 sm:h-4 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 rounded-full appearance-none cursor-pointer slider"
                          style={{
                            background: `linear-gradient(to right, #ef4444 0%, #f59e0b 50%, #22c55e 100%)`,
                          }}
                        />
                        <div className="text-center mt-4 sm:mt-6">
                          <span className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 text-lg sm:text-2xl font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg">
                            {formData.reliability}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex flex-col sm:flex-row gap-4 sm:justify-between animate-slide-up pt-6"
                    style={{ animationDelay: "0.3s" }}
                  >
                    <Button
                      variant="outline"
                      onClick={prevStep}
                      size="lg"
                      className="w-full sm:w-auto order-2 sm:order-1 min-h-[48px] sm:min-h-[56px] text-base sm:text-lg font-semibold border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 rounded-xl transition-all duration-200"
                    >
                      <ArrowLeft className="w-5 h-5 mr-3" /> Back
                    </Button>
                    <Button
                      onClick={nextStep}
                      size="lg"
                      className="w-full sm:w-auto order-1 sm:order-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-h-[48px] sm:min-h-[56px]"
                    >
                      Continue to Preferences
                      <ArrowRight className="w-5 h-5 ml-3" />
                    </Button>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6 sm:space-y-8 animate-fade-in">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      Step 3 of 4
                    </div>
                    <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                      Your Preferences
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
                      Help us understand what you'd like to see next in our
                      automation stack
                    </CardDescription>
                  </div>

                  <div className="space-y-8">
                    <div className="animate-slide-up">
                      <Label className="text-base sm:text-lg font-semibold block mb-4 sm:mb-6 text-slate-800 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0">
                          1
                        </div>
                        <span>
                          Lawyer Connect can replace missed consultations. Would
                          you invest to stop losing clients from unanswered
                          calls?
                        </span>
                      </Label>
                      <div className="bg-gradient-to-br from-slate-50 to-orange-50 p-4 sm:p-6 rounded-2xl border border-slate-200">
                        <RadioGroup
                          value={formData.valuePerception}
                          onValueChange={(value) =>
                            updateFormData("valuePerception", value)
                          }
                          className="space-y-3 sm:space-y-4"
                        >
                          {[
                            {
                              value: "yes",
                              label: "Yes",
                              icon: "💰",
                              desc: "I see the value in preventing lost clients",
                            },
                            {
                              value: "no",
                              label: "No",
                              icon: "❌",
                              desc: "Not interested at this time",
                            },
                            {
                              value: "maybe",
                              label: "Maybe",
                              icon: "🤔",
                              desc: "I'd need to see more details",
                            },
                          ].map((option) => (
                            <div
                              key={option.value}
                              className="flex items-center space-x-4 p-4 rounded-xl border-2 border-transparent hover:border-orange-200 hover:bg-orange-50/50 transition-all duration-200 cursor-pointer group"
                            >
                              <RadioGroupItem
                                value={option.value}
                                id={`value_${option.value}`}
                                className="w-6 h-6 border-2 border-slate-300 group-hover:border-orange-400"
                              />
                              <Label
                                htmlFor={`value_${option.value}`}
                                className="text-base cursor-pointer flex-1"
                              >
                                <div className="flex items-center gap-2 sm:gap-3 font-medium text-slate-700">
                                  <span className="text-lg sm:text-xl">
                                    {option.icon}
                                  </span>
                                  <span>{option.label}</span>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-500 mt-1 ml-6 sm:ml-8">
                                  {option.desc}
                                </p>
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                      <ErrorMessage error={errors.valuePerception} />
                    </div>

                    <div
                      className="animate-slide-up"
                      style={{ animationDelay: "0.1s" }}
                    >
                      <Label className="text-base sm:text-lg font-semibold block mb-4 sm:mb-6 text-slate-800 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0">
                          2
                        </div>
                        <span>
                          We're rolling out more automation tools. Which one
                          would you want us to build for you next? (Select all
                          that apply)
                        </span>
                      </Label>
                      <div className="bg-gradient-to-br from-slate-50 to-cyan-50 p-4 sm:p-6 rounded-2xl border border-slate-200 space-y-3 sm:space-y-4">
                        {[
                          {
                            id: "missed_call_agent",
                            label: "AI Missed Call Agent",
                            desc: "Converts missed calls into booked consults",
                            icon: "⚡",
                            color: "from-red-500 to-pink-500",
                          },
                          {
                            id: "reengagement_engine",
                            label: "Re-Engagement Engine",
                            desc: "Revives cold leads & past clients",
                            icon: "🔁",
                            color: "from-blue-500 to-indigo-500",
                          },
                          {
                            id: "review_referral_builder",
                            label: "Review & Referral Builder",
                            desc: "Automates reviews & generates referrals",
                            icon: "⭐",
                            color: "from-yellow-500 to-orange-500",
                          },
                          {
                            id: "client_status_updates",
                            label: "Client Status Updates",
                            desc: "Keeps clients informed automatically",
                            icon: "📢",
                            color: "from-green-500 to-emerald-500",
                          },
                          {
                            id: "intake_application",
                            label: "Intake Application",
                            desc: "Streamlined lead & client intake system",
                            icon: "📝",
                            color: "from-purple-500 to-violet-500",
                          },
                        ].map((tool) => (
                          <div
                            key={tool.id}
                            className={`flex items-start space-x-4 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer group ${
                              formData.nextTools.includes(tool.id)
                                ? "border-blue-300 bg-blue-50/50 shadow-md"
                                : "border-transparent hover:border-cyan-200 hover:bg-cyan-50/30"
                            }`}
                            onClick={() =>
                              handleNextToolsChange(
                                tool.id,
                                !formData.nextTools.includes(tool.id)
                              )
                            }
                          >
                            <Checkbox
                              id={tool.id}
                              checked={formData.nextTools.includes(tool.id)}
                              onCheckedChange={(checked) =>
                                handleNextToolsChange(
                                  tool.id,
                                  checked as boolean
                                )
                              }
                              className="mt-1 w-6 h-6 border-2 border-slate-300 group-hover:border-cyan-400"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div
                                  className={`w-8 h-8 bg-gradient-to-r ${tool.color} rounded-lg flex items-center justify-center text-white text-sm`}
                                >
                                  {tool.icon}
                                </div>
                                <Label
                                  htmlFor={tool.id}
                                  className="text-base font-semibold cursor-pointer text-slate-800"
                                >
                                  {tool.label}
                                </Label>
                              </div>
                              <p className="text-sm text-slate-600 ml-11 leading-relaxed">
                                {tool.desc}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <ErrorMessage error={errors.nextTools} />
                    </div>
                  </div>

                  <div
                    className="flex flex-col sm:flex-row gap-4 sm:justify-between animate-slide-up pt-6"
                    style={{ animationDelay: "0.2s" }}
                  >
                    <Button
                      variant="outline"
                      onClick={prevStep}
                      size="lg"
                      className="w-full sm:w-auto order-2 sm:order-1 min-h-[48px] sm:min-h-[56px] text-base sm:text-lg font-semibold border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 rounded-xl transition-all duration-200"
                    >
                      <ArrowLeft className="w-5 h-5 mr-3" /> Back
                    </Button>
                    <Button
                      onClick={nextStep}
                      size="lg"
                      className="w-full sm:w-auto order-1 sm:order-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-h-[48px] sm:min-h-[56px]"
                    >
                      Continue to Final Questions
                      <ArrowRight className="w-5 h-5 ml-3" />
                    </Button>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6 sm:space-y-8 animate-fade-in">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-100 to-purple-100 text-violet-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                      <div className="w-2 h-2 bg-violet-500 rounded-full"></div>
                      Step 4 of 4 - Final Questions
                    </div>
                    <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                      Final Questions
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
                      Just a few more questions to complete your feedback and
                      unlock your free bonus
                    </CardDescription>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                    <div className="animate-slide-up space-y-6">
                      <div>
                        <Label className="text-base sm:text-lg font-semibold block mb-4 sm:mb-6 text-slate-800 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0">
                            1
                          </div>
                          What type of firm are you?
                        </Label>
                        <div className="bg-gradient-to-br from-slate-50 to-violet-50 p-4 sm:p-6 rounded-2xl border border-slate-200">
                          <RadioGroup
                            value={formData.firmProfile}
                            onValueChange={(value) =>
                              updateFormData("firmProfile", value)
                            }
                            className="space-y-3 sm:space-y-4"
                          >
                            {[
                              {
                                value: "solo",
                                label: "Solo Practice",
                                icon: "👤",
                                desc: "Just me",
                              },
                              {
                                value: "2_10_lawyers",
                                label: "Small Firm",
                                icon: "👥",
                                desc: "2–10 lawyers",
                              },
                              {
                                value: "11_50_lawyers",
                                label: "Medium Firm",
                                icon: "🏢",
                                desc: "11–50 lawyers",
                              },
                              {
                                value: "50_plus_lawyers",
                                label: "Large Firm",
                                icon: "🏛️",
                                desc: "50+ lawyers",
                              },
                            ].map((option) => (
                              <div
                                key={option.value}
                                className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-xl border-2 border-transparent hover:border-violet-200 hover:bg-violet-50/50 transition-all duration-200 cursor-pointer group"
                              >
                                <RadioGroupItem
                                  value={option.value}
                                  id={option.value}
                                  className="w-6 h-6 border-2 border-slate-300 group-hover:border-violet-400"
                                />
                                <Label
                                  htmlFor={option.value}
                                  className="text-base cursor-pointer flex-1"
                                >
                                  <div className="flex items-center gap-2 sm:gap-3 font-medium text-slate-700">
                                    <span className="text-lg sm:text-xl">
                                      {option.icon}
                                    </span>
                                    <span>{option.label}</span>
                                  </div>
                                  <p className="text-xs sm:text-sm text-slate-500 mt-1 ml-6 sm:ml-8">
                                    {option.desc}
                                  </p>
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                        <ErrorMessage error={errors.firmProfile} />
                      </div>
                    </div>

                    <div
                      className="animate-slide-up space-y-6"
                      style={{ animationDelay: "0.1s" }}
                    >
                      <div>
                        <Label className="text-base sm:text-lg font-semibold block mb-4 sm:mb-6 text-slate-800 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0">
                            2
                          </div>
                          Would you like to join as a Founding Partner and get
                          early access to Lawyer Connect Premium?
                        </Label>
                        <div className="bg-gradient-to-br from-slate-50 to-emerald-50 p-4 sm:p-6 rounded-2xl border border-slate-200">
                          <RadioGroup
                            value={formData.earlyAccessInvitation}
                            onValueChange={(value) =>
                              updateFormData("earlyAccessInvitation", value)
                            }
                            className="space-y-3 sm:space-y-4"
                          >
                            {[
                              {
                                value: "yes",
                                label: "Yes, I'm interested!",
                                icon: "🚀",
                                desc: "I want early access and special pricing",
                              },
                              {
                                value: "no",
                                label: "Not right now",
                                icon: "⏰",
                                desc: "Maybe later",
                              },
                            ].map((option) => (
                              <div
                                key={option.value}
                                className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-xl border-2 border-transparent hover:border-emerald-200 hover:bg-emerald-50/50 transition-all duration-200 cursor-pointer group"
                              >
                                <RadioGroupItem
                                  value={option.value}
                                  id={`early_${option.value}`}
                                  className="w-6 h-6 border-2 border-slate-300 group-hover:border-emerald-400"
                                />
                                <Label
                                  htmlFor={`early_${option.value}`}
                                  className="text-base cursor-pointer flex-1"
                                >
                                  <div className="flex items-center gap-2 sm:gap-3 font-medium text-slate-700">
                                    <span className="text-lg sm:text-xl">
                                      {option.icon}
                                    </span>
                                    <span>{option.label}</span>
                                  </div>
                                  <p className="text-xs sm:text-sm text-slate-500 mt-1 ml-6 sm:ml-8">
                                    {option.desc}
                                  </p>
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                        <ErrorMessage error={errors.earlyAccessInvitation} />
                      </div>
                    </div>
                  </div>

                  {submitError && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 animate-slide-up">
                      <div className="flex items-center gap-3 text-red-700 mb-2">
                        <AlertCircle className="w-5 h-5" />
                        <span className="font-semibold text-lg">
                          Submission Error
                        </span>
                      </div>
                      <p className="text-red-600 text-base">{submitError}</p>
                    </div>
                  )}

                  <div
                    className="flex flex-col sm:flex-row gap-4 sm:justify-between animate-slide-up pt-8"
                    style={{ animationDelay: "0.2s" }}
                  >
                    <Button
                      variant="outline"
                      onClick={prevStep}
                      size="lg"
                      className="w-full sm:w-auto order-2 sm:order-1 min-h-[48px] sm:min-h-[56px] text-base sm:text-lg font-semibold border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 rounded-xl transition-all duration-200"
                    >
                      <ArrowLeft className="w-5 h-5 mr-3" /> Back
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      size="lg"
                      className="w-full sm:w-auto order-1 sm:order-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-h-[48px] sm:min-h-[56px] disabled:opacity-50 disabled:transform-none"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Submitting...
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span>Submit & Unlock Bonus</span>
                          <CheckCircle className="w-5 h-5" />
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

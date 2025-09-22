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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl animate-fade-in">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto mb-6 w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-3xl font-bold text-balance">
              Thank you for your feedback!
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground mt-4">
              Here's what happens next:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-8 pb-8">
            <div className="space-y-4">
              {[
                "You'll immediately unlock the Free Triage App (manual demo version).",
                "You'll be added to our Early Access list for the complete Legal AI Launchpad™ stack.",
                "Your feedback directly influences which automation we build first for our law firm subscribers.",
              ].map((text, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary-foreground text-sm font-bold">
                      {index + 1}
                    </span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-background">
      {/* HERO full-screen section */}
      <section className="relative h-screen flex items-center justify-center px-4">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-background to-background" />

        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <img
            src="/gavel.png"
            alt="Gavel"
            className="w-60 h-60 mx-auto animate-swing"
          />
          <div className="flex items-center justify-center gap-3 mb-6">
            <h1 className="text-4xl md:text-5xl font-bold text-balance">
              Vote on the Next Legal AI Tool
            </h1>
          </div>
          <p className="text-xl text-muted-foreground mb-8">
            Unlock Your Free Triage App
          </p>
          <Card className="bg-card/80 backdrop-blur">
            <CardContent className="p-8 text-left space-y-4">
              <p className="text-base leading-relaxed">
                We're building an automation stack for lawyers that converts
                missed calls into consultations, reviews into revenue, and leads
                into paying clients — automatically.
              </p>
              <p className="text-base leading-relaxed">
                Lawyer Connect™ was the first step. Your 2 minutes of feedback
                not only shapes what comes next…
              </p>
              <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                <p className="font-semibold text-primary">
                  👉 You'll also unlock a Free Triage App (manual demo version)
                  so you can optimize your intake immediately without spending a
                  dime.
                </p>
              </div>

              <div className="pt-4 flex justify-center">
                <Button size="lg" onClick={scrollToForm} className="group">
                  Start the 2‑minute survey
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Optional scroll cue */}
        <button
          onClick={scrollToForm}
          aria-label="Scroll to form"
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-muted-foreground text-sm hover:text-foreground transition-colors"
        >
          Scroll to form ↓
        </button>
      </section>

      {/* FORM section */}
      <section ref={formRef} className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 animate-slide-up">
            <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
              <span className="font-medium">
                Step {currentStep} of {TOTAL_STEPS}
              </span>
              <span className="font-medium">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <Progress value={progress} className="h-2" />

            <div className="flex justify-between mt-4">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    i + 1 < currentStep
                      ? "bg-primary text-primary-foreground"
                      : i + 1 === currentStep
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          <Card className="transition-all duration-300">
            <CardContent className="p-8">
              {currentStep === 1 && (
                <div className="space-y-8 animate-fade-in">
                  <div className="text-center">
                    <CardTitle className="text-2xl font-bold mb-2">
                      Contact Information
                    </CardTitle>
                    <CardDescription className="text-base">
                      Let's start with your basic information
                    </CardDescription>
                  </div>

                  <div className="space-y-6">
                    <div className="animate-slide-up">
                      <Label htmlFor="email" className="text-sm font-medium">
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
                        className={`mt-2 ${
                          errors.email ? "border-destructive" : ""
                        }`}
                      />
                      <ErrorMessage error={errors.email} />
                    </div>

                    <div
                      className="animate-slide-up"
                      style={{ animationDelay: "0.1s" }}
                    >
                      <Label htmlFor="name" className="text-sm font-medium">
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Your full name"
                        value={formData.name}
                        onChange={(e) => updateFormData("name", e.target.value)}
                        className={`mt-2 ${
                          errors.name ? "border-destructive" : ""
                        }`}
                      />
                      <ErrorMessage error={errors.name} />
                    </div>
                  </div>

                  <div
                    className="flex justify-end animate-slide-up"
                    style={{ animationDelay: "0.2s" }}
                  >
                    <Button onClick={nextStep} size="lg">
                      Continue <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-8 animate-fade-in">
                  <div className="text-center">
                    <CardTitle className="text-2xl font-bold mb-2">
                      Your Experience
                    </CardTitle>
                    <CardDescription className="text-base">
                      Tell us about your experience with Lawyer Connect
                    </CardDescription>
                  </div>

                  <div className="space-y-6">
                    <div className="animate-slide-up">
                      <Label className="text-sm font-semibold block mb-3">
                        On a scale of 1–10, how useful was the Lawyer Connect
                        demo for your firm?
                      </Label>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
                          <span>Not useful</span>
                          <span>Very useful</span>
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
                          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="text-center mt-3">
                          <span className="text-xl font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                            {formData.overallUsefulness}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      className="animate-slide-up"
                      style={{ animationDelay: "0.1s" }}
                    >
                      <Label className="text-sm font-semibold mb-3 block">
                        Since trying Lawyer Connect™, have client complaints
                        about lack of updates decreased?
                      </Label>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <RadioGroup
                          value={formData.clientCommunicationImpact}
                          onValueChange={(value) =>
                            updateFormData("clientCommunicationImpact", value)
                          }
                          className="space-y-2"
                        >
                          {[
                            {
                              value: "yes_noticeably",
                              label: "Yes, noticeably",
                            },
                            { value: "somewhat", label: "Somewhat" },
                            { value: "no_change", label: "No change" },
                            {
                              value: "too_early_to_tell",
                              label: "Too early to tell",
                            },
                          ].map((option) => (
                            <div
                              key={option.value}
                              className="flex items-center space-x-2"
                            >
                              <RadioGroupItem
                                value={option.value}
                                id={option.value}
                              />
                              <Label
                                htmlFor={option.value}
                                className="text-sm cursor-pointer"
                              >
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
                      <Label className="text-sm font-semibold block mb-3">
                        On a scale of 1–10, how reliable was Lawyer Connect™
                        (accuracy, speed, consistency)?
                      </Label>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
                          <span>Not reliable</span>
                          <span>Very reliable</span>
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
                          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="text-center mt-3">
                          <span className="text-xl font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                            {formData.reliability}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex justify-between animate-slide-up"
                    style={{ animationDelay: "0.3s" }}
                  >
                    <Button variant="outline" onClick={prevStep} size="lg">
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button onClick={nextStep} size="lg">
                      Continue <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-8 animate-fade-in">
                  <div className="text-center">
                    <CardTitle className="text-2xl font-bold mb-2">
                      Your Preferences
                    </CardTitle>
                    <CardDescription className="text-base">
                      Help us understand what you'd like to see next
                    </CardDescription>
                  </div>

                  <div className="space-y-6">
                    <div className="animate-slide-up">
                      <Label className="text-sm font-semibold mb-3 block">
                        Lawyer Connect can replace missed consultations. Would
                        you invest to stop losing clients from unanswered calls?
                      </Label>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <RadioGroup
                          value={formData.valuePerception}
                          onValueChange={(value) =>
                            updateFormData("valuePerception", value)
                          }
                          className="space-y-2"
                        >
                          {[
                            { value: "yes", label: "Yes" },
                            { value: "no", label: "No" },
                            { value: "maybe", label: "Maybe" },
                          ].map((option) => (
                            <div
                              key={option.value}
                              className="flex items-center space-x-2"
                            >
                              <RadioGroupItem
                                value={option.value}
                                id={`value_${option.value}`}
                              />
                              <Label
                                htmlFor={`value_${option.value}`}
                                className="text-sm cursor-pointer"
                              >
                                {option.label}
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
                      <Label className="text-sm font-semibold mb-3 block">
                        We're rolling out more automation tools. Which one would
                        you want us to build for you next? (Select all that
                        apply)
                      </Label>
                      <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                        {[
                          {
                            id: "missed_call_agent",
                            label:
                              "⚡ AI Missed Call Agent – Converts missed calls into booked consults",
                          },
                          {
                            id: "reengagement_engine",
                            label:
                              "🔁 Re-Engagement Engine – Revives cold leads & past clients",
                          },
                          {
                            id: "review_referral_builder",
                            label:
                              "⭐ Review & Referral Builder – Automates reviews & generates referrals",
                          },
                          {
                            id: "client_status_updates",
                            label:
                              "📢 LawyerConnect™: Client Status Updates – Keeps clients informed automatically",
                          },
                          {
                            id: "intake_application",
                            label:
                              "📝 Intake Application – Streamlined lead & client intake system",
                          },
                        ].map((tool) => (
                          <div
                            key={tool.id}
                            className="flex items-start space-x-2"
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
                            />
                            <Label
                              htmlFor={tool.id}
                              className="text-sm leading-relaxed cursor-pointer"
                            >
                              {tool.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                      <ErrorMessage error={errors.nextTools} />
                    </div>
                  </div>

                  <div
                    className="flex justify-between animate-slide-up"
                    style={{ animationDelay: "0.2s" }}
                  >
                    <Button variant="outline" onClick={prevStep} size="lg">
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button onClick={nextStep} size="lg">
                      Continue <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-8 animate-fade-in">
                  <div className="text-center">
                    <CardTitle className="text-2xl font-bold mb-2">
                      Final Questions
                    </CardTitle>
                    <CardDescription className="text-base">
                      Just a few more questions to complete your feedback
                    </CardDescription>
                  </div>

                  <div className="space-y-6">
                    <div className="animate-slide-up">
                      <Label className="text-sm font-semibold mb-3 block">
                        What type of firm are you?
                      </Label>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <RadioGroup
                          value={formData.firmProfile}
                          onValueChange={(value) =>
                            updateFormData("firmProfile", value)
                          }
                          className="space-y-2"
                        >
                          {[
                            { value: "solo", label: "Solo" },
                            { value: "2_10_lawyers", label: "2–10 lawyers" },
                            { value: "11_50_lawyers", label: "11–50 lawyers" },
                            { value: "50_plus_lawyers", label: "50+ lawyers" },
                          ].map((option) => (
                            <div
                              key={option.value}
                              className="flex items-center space-x-2"
                            >
                              <RadioGroupItem
                                value={option.value}
                                id={option.value}
                              />
                              <Label
                                htmlFor={option.value}
                                className="text-sm cursor-pointer"
                              >
                                {option.label}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                      <ErrorMessage error={errors.firmProfile} />
                    </div>

                    <div
                      className="animate-slide-up"
                      style={{ animationDelay: "0.1s" }}
                    >
                      <Label className="text-sm font-semibold mb-3 block">
                        Would you like to join as a Founding Partner and get
                        early access to Lawyer Connect Premium?
                      </Label>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <RadioGroup
                          value={formData.earlyAccessInvitation}
                          onValueChange={(value) =>
                            updateFormData("earlyAccessInvitation", value)
                          }
                          className="space-y-2"
                        >
                          {[
                            { value: "yes", label: "Yes" },
                            { value: "no", label: "No" },
                          ].map((option) => (
                            <div
                              key={option.value}
                              className="flex items-center space-x-2"
                            >
                              <RadioGroupItem
                                value={option.value}
                                id={`early_${option.value}`}
                              />
                              <Label
                                htmlFor={`early_${option.value}`}
                                className="text-sm cursor-pointer"
                              >
                                {option.label}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                      <ErrorMessage error={errors.earlyAccessInvitation} />
                    </div>
                  </div>

                  {submitError && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="w-4 h-4" />
                        <span className="font-medium">Submission Error</span>
                      </div>
                      <p className="text-destructive text-sm mt-1">
                        {submitError}
                      </p>
                    </div>
                  )}

                  <div
                    className="flex justify-between animate-slide-up"
                    style={{ animationDelay: "0.2s" }}
                  >
                    <Button variant="outline" onClick={prevStep} size="lg">
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      size="lg"
                    >
                      {isSubmitting ? "Submitting..." : "Submit Feedback"}
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

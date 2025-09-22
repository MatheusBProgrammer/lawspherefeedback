"use client"

import { useEffect, useState } from "react"

interface UTMParams {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
  referrer?: string
  landing_page?: string
}

export function useUTMTracking() {
  const [utmParams, setUtmParams] = useState<UTMParams>({})

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return

    const urlParams = new URLSearchParams(window.location.search)
    const referrer = document.referrer
    const landing_page = window.location.href

    const params: UTMParams = {
      utm_source: urlParams.get("utm_source") || undefined,
      utm_medium: urlParams.get("utm_medium") || undefined,
      utm_campaign: urlParams.get("utm_campaign") || undefined,
      utm_term: urlParams.get("utm_term") || undefined,
      utm_content: urlParams.get("utm_content") || undefined,
      referrer: referrer || undefined,
      landing_page: landing_page,
    }

    // Store UTM params in sessionStorage to persist across page reloads
    const storedParams = sessionStorage.getItem("utm_params")
    if (storedParams) {
      const parsed = JSON.parse(storedParams)
      // Only update if we have new UTM params, otherwise keep stored ones
      const hasNewUTMParams = Object.values(params).some(
        (value) =>
          value &&
          value !==
            parsed[Object.keys(params).find((key) => params[key as keyof UTMParams] === value) as keyof UTMParams],
      )

      if (hasNewUTMParams) {
        sessionStorage.setItem("utm_params", JSON.stringify(params))
        setUtmParams(params)
      } else {
        setUtmParams(parsed)
      }
    } else {
      sessionStorage.setItem("utm_params", JSON.stringify(params))
      setUtmParams(params)
    }
  }, [])

  return utmParams
}

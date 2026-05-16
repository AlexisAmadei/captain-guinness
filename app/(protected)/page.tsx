"use client";

import { ReviewPill } from "@/components/review-pill/ReviewPill";
import Map from "../ui/mapbox";

export default function Home() {
  return (
    <>
      <Map />
      <ReviewPill />
    </>
  );
}


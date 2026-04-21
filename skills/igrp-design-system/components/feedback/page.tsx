"use client";

import React from "react";
import {
  IGRPPageHeader,
  IGRPAlert,
  IGRPBadge,
  IGRPButton,
  IGRPCard,
  IGRPCardHeader,
  IGRPCardTitle,
  IGRPCardContent,
} from "@igrp/igrp-framework-react-design-system";

export default function TestFeedbackPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Testing IGRPPageHeader with browser-back back button and children as actions */}
      <IGRPPageHeader
        title="Feedback & Status Test"
        description="Verifying updated Alert, Badge, and Header components."
        showBackButton
        backButtonUseBrowserBack
        backButtonShowText
        backButtonText="Back"
        backButtonAriaLabel="Go back"
      >
        <IGRPButton variant="outline" showIcon iconName="RefreshCcw">
          Reload
        </IGRPButton>
      </IGRPPageHeader>

      <IGRPCard>
        <IGRPCardHeader>
          <IGRPCardTitle>Alerts (Children Pattern)</IGRPCardTitle>
        </IGRPCardHeader>
        <IGRPCardContent className="flex flex-col gap-4">
          {/* Testing IGRPAlert using children for content */}
          <IGRPAlert variant="soft" color="destructive">
            <div className="flex flex-col gap-1">
              <h4 className="font-medium">Connection Error</h4>
              <p className="text-sm">
                The system was unable to reach the API. Please check your
                internet connection.
              </p>
            </div>
          </IGRPAlert>

          <IGRPAlert variant="soft" color="success">
            <div className="text-sm">
              The operation was completed successfully. Your profile has been
              updated.
            </div>
          </IGRPAlert>
        </IGRPCardContent>
      </IGRPCard>

      <IGRPCard>
        <IGRPCardHeader>
          <IGRPCardTitle>Badges (Color vs Variant Pattern)</IGRPCardTitle>
        </IGRPCardHeader>
        <IGRPCardContent>
          <div className="flex flex-wrap gap-2">
            {/* Testing IGRPBadge using color for status */}
            <IGRPBadge color="success">Active</IGRPBadge>
            <IGRPBadge color="destructive">Inactive</IGRPBadge>
            <IGRPBadge color="warning" dot>
              Pending
            </IGRPBadge>
            <IGRPBadge color="info">Processing</IGRPBadge>

            {/* Testing combined Variant and Color */}
            <IGRPBadge variant="outline" color="indigo">
              Indigo Outline
            </IGRPBadge>
            <IGRPBadge variant="outline" color="secondary">
              Secondary Outline
            </IGRPBadge>
          </div>
        </IGRPCardContent>
      </IGRPCard>
    </div>
  );
}

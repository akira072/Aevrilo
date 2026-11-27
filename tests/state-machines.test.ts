import { describe, expect, it } from "vitest";
import {
  canTransitionProjectStatus,
  validateTeamSubmissionEligibility,
} from "@/lib/domain/state-machines";

describe("Project Lifecycle & Hackathon Eligibility State Machines", () => {
  it("allows valid lifecycle progression ASSIGNED -> IN PROGRESS -> DELIVERED -> COMPLETED", () => {
    expect(canTransitionProjectStatus("ASSIGNED", "IN PROGRESS", "freelancer")).toBe(true);
    expect(canTransitionProjectStatus("IN PROGRESS", "DELIVERED", "freelancer")).toBe(true);
    expect(canTransitionProjectStatus("DELIVERED", "COMPLETED", "client")).toBe(true);
    expect(canTransitionProjectStatus("DELIVERED", "IN PROGRESS", "client")).toBe(true); // revision
  });

  it("blocks unauthorized role transitions", () => {
    expect(canTransitionProjectStatus("DELIVERED", "COMPLETED", "freelancer")).toBe(false);
    expect(canTransitionProjectStatus("ASSIGNED", "COMPLETED", "client")).toBe(false);
    expect(canTransitionProjectStatus("CANCELLED", "IN PROGRESS", "admin")).toBe(false);
  });

  it("enforces hackathon team size bounds and submission deadlines", () => {
    const future = new Date(Date.now() + 86400_000).toISOString();
    const past = new Date(Date.now() - 86400_000).toISOString();

    expect(
      validateTeamSubmissionEligibility({
        endDate: future,
        allowLateSubmission: false,
        teamLateApproved: false,
        minTeamSize: 2,
        maxTeamSize: 4,
        acceptedMemberCount: 1,
      }).allowed
    ).toBe(false);

    expect(
      validateTeamSubmissionEligibility({
        endDate: past,
        allowLateSubmission: false,
        teamLateApproved: false,
        minTeamSize: 1,
        maxTeamSize: 4,
        acceptedMemberCount: 2,
      }).allowed
    ).toBe(false);

    expect(
      validateTeamSubmissionEligibility({
        endDate: past,
        allowLateSubmission: false,
        teamLateApproved: true,
        minTeamSize: 1,
        maxTeamSize: 4,
        acceptedMemberCount: 2,
      }).allowed
    ).toBe(true);
  });
});

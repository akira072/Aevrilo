export type RequestStatus =
  | "OPEN"
  | "UNDER REVIEW"
  | "ASSIGNED"
  | "IN PROGRESS"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTED";

export type ProjectStatus =
  | "ASSIGNED"
  | "IN PROGRESS"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTED";

export type ActorRelation = "client" | "freelancer" | "admin";

const PROJECT_TRANSITIONS: Record<
  ProjectStatus,
  Partial<Record<ProjectStatus, ActorRelation[]>>
> = {
  ASSIGNED: {
    "IN PROGRESS": ["freelancer", "admin"],
    CANCELLED: ["client", "admin"],
    DISPUTED: ["client", "freelancer", "admin"],
  },
  "IN PROGRESS": {
    DELIVERED: ["freelancer", "admin"],
    CANCELLED: ["client", "admin"],
    DISPUTED: ["client", "freelancer", "admin"],
  },
  DELIVERED: {
    "IN PROGRESS": ["client", "admin"], // revision requested
    COMPLETED: ["client", "admin"],
    DISPUTED: ["client", "freelancer", "admin"],
  },
  COMPLETED: {
    DISPUTED: ["client", "freelancer", "admin"],
  },
  CANCELLED: {},
  DISPUTED: {
    "IN PROGRESS": ["admin"],
    COMPLETED: ["admin"],
    CANCELLED: ["admin"],
  },
};

export function canTransitionProjectStatus(
  from: ProjectStatus,
  to: ProjectStatus,
  actor: ActorRelation
): boolean {
  if (from === to) return false;
  const allowedActors = PROJECT_TRANSITIONS[from]?.[to];
  if (!allowedActors) return false;
  return allowedActors.includes(actor);
}

export function canTransitionPaymentStatus(
  from: "pending" | "processing" | "successful" | "failed",
  to: "pending" | "processing" | "successful" | "failed",
  isVerifierAdminOrAuthorized: boolean,
  hasExternalReference: boolean
): { allowed: boolean; reason?: string } {
  if (from === to) return { allowed: false, reason: "Payment is already in this status." };
  if (from === "successful") {
    return { allowed: false, reason: "Successful payments are immutable." };
  }
  if (to === "successful") {
    if (!isVerifierAdminOrAuthorized) {
      return {
        allowed: false,
        reason: "Only an authorized admin or verified settlement workflow may mark a payment successful.",
      };
    }
    if (!hasExternalReference) {
      return {
        allowed: false,
        reason: "An external UPI/bank reference (UTR) is required to verify a successful payment.",
      };
    }
  }
  return { allowed: true };
}

export interface HackathonWindowCheckInput {
  endDate: string;
  allowLateSubmission: boolean;
  teamLateApproved: boolean;
  minTeamSize: number;
  maxTeamSize: number;
  acceptedMemberCount: number;
  now?: Date;
}

export function validateTeamSubmissionEligibility(input: HackathonWindowCheckInput): {
  allowed: boolean;
  reason?: string;
} {
  if (input.acceptedMemberCount < input.minTeamSize) {
    return {
      allowed: false,
      reason: `Team requires at least ${input.minTeamSize} accepted member(s) (currently ${input.acceptedMemberCount}).`,
    };
  }
  if (input.acceptedMemberCount > input.maxTeamSize) {
    return {
      allowed: false,
      reason: `Team exceeds maximum size of ${input.maxTeamSize} member(s).`,
    };
  }
  const now = input.now ?? new Date();
  const deadline = new Date(input.endDate);
  if (now > deadline && !input.allowLateSubmission && !input.teamLateApproved) {
    return {
      allowed: false,
      reason: "The hackathon submission deadline has passed and no organizer exception is granted.",
    };
  }
  return { allowed: true };
}

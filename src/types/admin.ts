// ==================== ENUMS ====================
export type UserRole = "SUPERADMIN" | "ADMIN" | "USER" | "JOB_UPLOADER";
export type UserStatus = "PENDING" | "ACTIVE" | "SUSPENDED";
export type UserPlan = "PRO" | "ELITE" | "LEVEL_UP" | "HIRING_HUB" | "SKILL_BUILDER";
export type SubscriptionStatus = "ACTIVE" | "EXPIRED" | "CANCELLED";
export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
export type SubmissionStatus = "PENDING" | "APPROVED" | "NEEDS_IMPROVEMENT";
export type ChallengeType = "AUDIO" | "QUIZ";

// ==================== API RESPONSE ====================
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ==================== AUTH ====================
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  isPunished: boolean;
  punishedUntil: string | null;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export type AuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "ACCOUNT_PENDING"
  | "ACCOUNT_SUSPENDED"
  | "EMAIL_ALREADY_EXISTS"
  | "INVALID_TOKEN"
  | "TOKEN_EXPIRED"
  | "MISSING_TOKEN"
  | "FORBIDDEN";

// ==================== SUBSCRIPTIONS ====================
export interface Subscription {
  id: string;
  userId: string;
  plan: UserPlan;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  hasPaid: boolean;
  paidAt: string | null;
  paymentNote: string | null;
  assignedBy: string | null;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    status: UserStatus;
  };
}

// ==================== ADMIN - USERS ====================
export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  plan: UserPlan | null;
  isPunished: boolean;
  punishedUntil: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  strikeCount: number;
}

export interface AdminUserDetail extends AdminUser {
  city: string | null;
  country: string | null;
  reference: string | null;
  avatar: string | null;
  adminNotes: string | null;
  startDate: string | null;
  endDate: string | null;
  strikes: Strike[];
  enrollments: UserEnrollment[];
  academyProgress: AcademyProgress[];
  subscription: Subscription | null;
}

export interface Strike {
  id: number;
  reason: string;
  createdAt: string;
  isManual: boolean;
  classSession: {
    id: number;
    topic: string;
    scheduledAt: string;
  } | null;
}

export interface UserEnrollment {
  id: number;
  attendanceStatus: AttendanceStatus | null;
  attendanceMarkedAt: string | null;
  classSession: {
    id: number;
    topic: string;
    scheduledAt: string;
    type: string;
  };
}

export interface AcademyProgress {
  courseId: number;
  courseName: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
}

// Query params for users list
export interface GetUsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  sortBy?: "createdAt" | "lastLoginAt" | "firstName";
  sortOrder?: "asc" | "desc";
}

// Create user payload
export interface CreateUserPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: UserRole;
}

// Update user payload
export interface UpdateUserPayload {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: UserRole;
}

// Update user status payload
export interface UpdateStatusPayload {
  status: UserStatus;
  reason?: string;
}

// Approve registration response (PENDING -> ACTIVE)
export interface ApproveRegistrationResponse {
  id: string;
  status: UserStatus;
  message: string;
}

// Reject registration payload (deletes user from DB)
export interface RejectRegistrationPayload {
  reason: string;
}

export interface RejectRegistrationResponse {
  message: string;
  deletedUserId: string;
}

// Activate user payload (INACTIVE -> ACTIVE, SUPERADMIN only)
export interface ActivateUserPayload {
  plan: UserPlan;
}

export interface ActivateUserResponse {
  id: string;
  status: UserStatus;
  plan: UserPlan;
  startDate: string;
  endDate: string;
  message: string;
}

// Issue strike payload
export interface IssueStrikePayload {
  reason: string;
}

// Update notes payload
export interface UpdateNotesPayload {
  notes: string;
}

// ==================== ADMIN - CLASSES ====================
export interface AdminClass {
  id: number;
  title: string;
  type: "REGULAR" | "WORKSHOP";
  startTime: string;
  endTime: string;
  capacityMax: number | null;
  enrolledCount: number;
  meetLink: string | null;
  description: string | null;
  createdAt: string;
}

export interface ClassAttendee {
  enrollmentId: number;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string | null;
  attendanceStatus: AttendanceStatus | null;
  attendanceMarkedAt: string | null;
}

// Query params for classes list
export interface GetClassesQuery {
  page?: number;
  limit?: number;
  type?: "REGULAR" | "WORKSHOP";
  from?: string;
  to?: string;
}

// Create class payload
export interface CreateClassPayload {
  title: string;
  type: "REGULAR" | "WORKSHOP";
  startTime: string;
  endTime: string;
  meetLink?: string;
  capacityMax?: number;
  description?: string;
}

// Save attendance payload
export interface AttendanceRecord {
  enrollmentId: number;
  status: AttendanceStatus;
}

export interface SaveAttendancePayload {
  attendance: AttendanceRecord[];
}

// ==================== ADMIN - SUBMISSIONS ====================
export interface AdminSubmission {
  id: string;
  challengeId: number;
  challengeTitle: string;
  challengeType: ChallengeType;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentAvatar: string | null;
  status: SubmissionStatus;
  fileUrl: string | null;
  submittedAt: string;
  feedback: string | null;
  score: number | null;
}

// Query params for submissions list
export interface GetSubmissionsQuery {
  page?: number;
  limit?: number;
  status?: SubmissionStatus;
  type?: ChallengeType;
}

// Review submission payload
export interface ReviewSubmissionPayload {
  status: "APPROVED" | "NEEDS_IMPROVEMENT";
  feedback: string;
  score?: number;
}

// ==================== SYSTEM CONFIG ====================
export interface SystemConfig {
  id: string;
  maxStrikesForPunishment: number;
  punishmentDurationDays: number;
  lateCancellationHours: number;
  jobBoardEnabled: boolean;
  academyEnabled: boolean;
  updatedAt: string;
}

export interface UpdateSystemConfigPayload {
  maxStrikesForPunishment?: number;
  punishmentDurationDays?: number;
  lateCancellationHours?: number;
  jobBoardEnabled?: boolean;
  academyEnabled?: boolean;
}

// ==================== SUBSCRIPTIONS MANAGEMENT ====================
export interface CreateSubscriptionPayload {
  userId: string;
  plan: UserPlan;
  startDate: string;
  endDate: string;
  hasPaid?: boolean;
  paymentNote?: string;
}

export interface UpdateSubscriptionPayload {
  plan?: UserPlan;
  status?: SubscriptionStatus;
  startDate?: string;
  endDate?: string;
  hasPaid?: boolean;
  paymentNote?: string;
}

export interface GetSubscriptionsQuery {
  page?: number;
  limit?: number;
  userId?: string;
  status?: SubscriptionStatus;
}

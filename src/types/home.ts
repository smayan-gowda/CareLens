export type HomeType = 'house' | 'apartment' | 'condo' | 'townhouse' | 'other';
export type RoomType = 'bathroom' | 'bedroom' | 'kitchen' | 'living' | 'dining' | 'hallway' | 'laundry' | 'garage' | 'basement' | 'entryway' | 'office' | 'staircase' | 'custom';

export interface RoomImage {
  id: string;
  roomId: string;
  url: string;
  name: string;
  size: number;
  uploadedAt: string;
}

export interface Room {
  id: string;
  homeId: string;
  name: string;
  type: RoomType;
  floor: number;
  description?: string;
  coverImage?: string;
  images: RoomImage[];
  createdAt: string;
  updatedAt: string;
}

export interface Home {
  id: string;
  userId: string;
  name: string;
  nickname?: string;
  address?: string;
  homeType: HomeType;
  yearBuilt?: number;
  floors: number;
  description?: string;
  coverImage?: string;
  rooms: Room[];
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  userId: string;
  homeId: string;
  action: string;
  description: string;
  timestamp: string;
  scanId?: string;
}

export type NotificationType = 'report' | 'score' | 'recommendation' | 'resource' | 'community';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  link?: string;
  scanId?: string;
}

export type TimelineEventType = 'scan' | 'improvement' | 'score_change' | 'note' | 'recommendation';

export interface TimelineEvent {
  id: string;
  userId: string;
  homeId: string;
  roomId?: string;
  type: TimelineEventType;
  title: string;
  description: string;
  timestamp: string;
  scoreChange?: {
    from: number;
    to: number;
  };
  details?: string[];
  link?: string;
  scanId?: string;
}

export interface Resource {
  id: string;
  category: 'Fall Prevention' | 'Accessibility' | 'Emergency' | 'Caregiving';
  title: string;
  description: string;
  content: string;
  tags: string[];
  imageUrl?: string;
  link?: string;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  category: 'Home Safety' | 'Caregiving' | 'Accessibility' | 'Technology' | 'General';
  title: string;
  content: string;
  likes: number;
  likedBy?: string[];
  commentCount: number;
  timestamp: string;
}

export interface CommunityComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  likes?: number;
  likedBy?: string[];
  timestamp: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  ageGroup?: string;
  role: 'Homeowner' | 'Caregiver' | 'Family member';
  notificationsEnabled: boolean;
  privacyLevel: 'Private' | 'Limited' | 'Public';
}

export interface StagedPhoto {
  id: string;
  userId: string;
  homeId: string;
  roomId?: string;
  roomType: RoomType;
  title: string;
  notes?: string;
  imageUrl: string;
  status: 'unscanned' | 'scanned';
  scanId?: string;
  capturedFrom: 'mobile' | 'desktop';
  createdAt: string;
  updatedAt: string;
}

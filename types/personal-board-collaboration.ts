export interface PersonalBoardCollaborator {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhotoURL?: string;
  role: 'viewer' | 'editor' | 'admin';
  invitedBy: string;
  invitedAt: Date;
  acceptedAt?: Date;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  permissions: string[];
}

export interface PersonalBoardInvitation {
  id: string;
  boardOwnerId: string;
  boardOwnerName: string;
  boardOwnerEmail: string;
  invitedEmail: string;
  role: 'viewer' | 'editor' | 'admin';
  invitationCode: string;
  expiresAt: Date;
  createdAt: Date;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}

export interface PersonalBoardAccess {
  canView: boolean;
  canEdit: boolean;
  canManageCollaborators: boolean;
  canManageSettings: boolean;
  canDelete: boolean;
}

export interface PersonalBoardSettings {
  isPrivate: boolean;
  allowCollaborators: boolean;
  defaultCollaboratorRole: 'viewer' | 'editor';
  requireApproval: boolean;
  maxCollaborators: number;
}

// Permission definitions for personal boards
export const PERSONAL_BOARD_PERMISSIONS = {
  BOARD_VIEW: 'board.view',
  BOARD_EDIT: 'board.edit',
  TASKS_CREATE: 'tasks.create',
  TASKS_EDIT: 'tasks.edit',
  TASKS_DELETE: 'tasks.delete',
  TASKS_ASSIGN: 'tasks.assign',
  COLUMNS_CREATE: 'columns.create',
  COLUMNS_EDIT: 'columns.edit',
  COLUMNS_DELETE: 'columns.delete',
  COLLABORATORS_INVITE: 'collaborators.invite',
  COLLABORATORS_REMOVE: 'collaborators.remove',
  COLLABORATORS_MANAGE: 'collaborators.manage',
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_EDIT: 'settings.edit'
} as const;

// Role-based permissions
export const PERSONAL_BOARD_ROLE_PERMISSIONS = {
  viewer: [
    PERSONAL_BOARD_PERMISSIONS.BOARD_VIEW,
  ],
  editor: [
    PERSONAL_BOARD_PERMISSIONS.BOARD_VIEW,
    PERSONAL_BOARD_PERMISSIONS.BOARD_EDIT,
    PERSONAL_BOARD_PERMISSIONS.TASKS_CREATE,
    PERSONAL_BOARD_PERMISSIONS.TASKS_EDIT,
    PERSONAL_BOARD_PERMISSIONS.TASKS_DELETE,
    PERSONAL_BOARD_PERMISSIONS.TASKS_ASSIGN,
    PERSONAL_BOARD_PERMISSIONS.COLUMNS_CREATE,
    PERSONAL_BOARD_PERMISSIONS.COLUMNS_EDIT,
    PERSONAL_BOARD_PERMISSIONS.COLUMNS_DELETE,
  ],
  admin: [
    PERSONAL_BOARD_PERMISSIONS.BOARD_VIEW,
    PERSONAL_BOARD_PERMISSIONS.BOARD_EDIT,
    PERSONAL_BOARD_PERMISSIONS.TASKS_CREATE,
    PERSONAL_BOARD_PERMISSIONS.TASKS_EDIT,
    PERSONAL_BOARD_PERMISSIONS.TASKS_DELETE,
    PERSONAL_BOARD_PERMISSIONS.TASKS_ASSIGN,
    PERSONAL_BOARD_PERMISSIONS.COLUMNS_CREATE,
    PERSONAL_BOARD_PERMISSIONS.COLUMNS_EDIT,
    PERSONAL_BOARD_PERMISSIONS.COLUMNS_DELETE,
    PERSONAL_BOARD_PERMISSIONS.COLLABORATORS_INVITE,
    PERSONAL_BOARD_PERMISSIONS.COLLABORATORS_REMOVE,
    PERSONAL_BOARD_PERMISSIONS.COLLABORATORS_MANAGE,
    PERSONAL_BOARD_PERMISSIONS.SETTINGS_VIEW,
    PERSONAL_BOARD_PERMISSIONS.SETTINGS_EDIT,
  ]
} as const;
